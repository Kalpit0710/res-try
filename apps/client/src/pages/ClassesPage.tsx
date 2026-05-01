import { useEffect, useState } from 'react';
import { apiClient } from '../lib/clientApi';

export function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [assigning, setAssigning] = useState<{ cls: any } | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);

  async function load() { const res = await apiClient.getClasses(); setClasses(res.data ?? res); }
  useEffect(() => { load(); apiClient.getSubjects().then(r=>setSubjects(r.data??r)); }, []);

  async function remove(id: string) { if (!confirm('Delete class?')) return; await apiClient.deleteClass(id); load(); }

  async function removeSubject(classId: string, subjectId: string) {
    await apiClient.removeSubjectFromClass(classId, subjectId);
    load();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Classes</h2>
          <p className="text-sm text-black/60">Manage classes and assign subjects</p>
        </div>
        <div>
          <button onClick={() => setEditing({})} className="rounded-md bg-orange-500 text-white px-3 py-2">Add Class</button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {classes.map(c => (
          <div key={c._id} className="border p-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(c.subjects || []).length ? (
                    (c.subjects || []).map((subject: any) => (
                      <span key={subject._id} className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 text-sm">
                        <span>{subject.name}</span>
                        <button
                          onClick={() => removeSubject(c._id, subject._id)}
                          className="text-red-600 hover:text-red-700"
                          title="Remove subject"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <div className="text-sm text-black/60">No subjects assigned yet.</div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAssigning({ cls: c })} className="text-sm">Assign Subject</button>
                <button onClick={() => setEditing(c)} className="text-sm text-orange-600">Edit</button>
                <button onClick={() => remove(c._id)} className="text-sm text-red-600">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing !== null && <ClassForm cls={editing} onClose={() => { setEditing(null); load(); }} />}

      {assigning && (
        <AssignSubjectModal cls={assigning.cls} subjects={subjects} onClose={() => { setAssigning(null); load(); }} />
      )}
    </div>
  );
}

function ClassForm({ cls = {}, onClose }: { cls?: any; onClose: () => void }) {
  const [name, setName] = useState(cls.name ?? '');
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      if (cls && cls._id) await apiClient.updateClass(cls._id, { name }); else await apiClient.createClass({ name });
      onClose();
    } catch (err: unknown) { alert((err as Error)?.message ?? 'Failed'); } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-md p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold">{cls._id ? 'Edit' : 'Add'} Class</h3>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter class name like 10-A" className="mt-3 w-full border px-2 py-2 rounded" />
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
          <button onClick={save} disabled={loading} className="px-3 py-1 bg-orange-500 text-white rounded">Save</button>
        </div>
      </div>
    </div>
  );
}

function AssignSubjectModal({ cls, subjects, onClose }: { cls: any; subjects: any[]; onClose: () => void }) {
  const [subjectId, setSubjectId] = useState('');
  const assignedIds = new Set((cls.subjects || []).map((subject: any) => subject._id));
  const availableSubjects = subjects.filter((subject) => !assignedIds.has(subject._id));

  async function add() {
    if (!subjectId) return;
    await apiClient.addSubjectToClass(cls._id, subjectId);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-md p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold">Assign Subject to {cls.name}</h3>
        <div className="mt-3 text-sm text-black/60">
          {availableSubjects.length ? 'Select a subject that is not already assigned.' : 'All available subjects are already assigned to this class.'}
        </div>
        <select
          className="mt-3 w-full border px-2 py-2 rounded"
          value={subjectId}
          onChange={e=>setSubjectId(e.target.value)}
          disabled={!availableSubjects.length}
        >
          <option value="">Select subject</option>
          {availableSubjects.map(s=> <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
          <button onClick={add} className="px-3 py-1 bg-orange-500 text-white rounded">Assign</button>
        </div>
      </div>
    </div>
  );
}

export default ClassesPage;
