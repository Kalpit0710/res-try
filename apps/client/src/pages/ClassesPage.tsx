import { useEffect, useState } from 'react';
import { apiClient } from '../lib/clientApi';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [assigning, setAssigning] = useState<{ cls: any } | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await apiClient.getClasses();
      setClasses(res.data ?? res);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); apiClient.getSubjects().then(r=>setSubjects(r.data??r)); }, []);

  async function remove(id: string) { if (!confirm('Delete class?')) return; await apiClient.deleteClass(id); load(); }

  async function removeSubject(classId: string, subjectId: string) {
    await apiClient.removeSubjectFromClass(classId, subjectId);
    load();
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Classes</h2>
          <p className="text-sm text-black/60">Manage classes and assign subjects</p>
        </div>
        <div>
          <button onClick={() => setEditing({})} className="rounded-md bg-orange-500 text-white px-3 py-2">Add Class</button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border bg-white p-3">
              <LoadingSkeleton className="h-6 w-32 mb-3" />
              <LoadingSkeleton className="h-5 w-44" />
            </div>
          ))
        ) : classes.length ? (
          classes.map(c => (
            <div key={c._id} className="rounded-lg border bg-white p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setAssigning({ cls: c })} className="text-sm">Assign Subject</button>
                  <button onClick={() => setEditing(c)} className="text-sm text-orange-600">Edit</button>
                  <button onClick={() => remove(c._id)} className="text-sm text-red-600">Delete</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border bg-white p-6 text-center text-sm text-black/50">No classes available yet.</div>
        )}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-6">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <h3 className="text-lg font-semibold">{cls._id ? 'Edit' : 'Add'} Class</h3>
        <label className="mt-3 flex flex-col gap-1 text-sm font-medium text-black/80">
          <span>Class Name</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter class name like 10-A" className="w-full border px-2 py-2 rounded font-normal" />
        </label>
        <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-6">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <h3 className="text-lg font-semibold">Assign Subject to {cls.name}</h3>
        <div className="mt-3 text-sm text-black/60">
          {availableSubjects.length ? 'Select a subject that is not already assigned.' : 'All available subjects are already assigned to this class.'}
        </div>
        <label className="mt-3 flex flex-col gap-1 text-sm font-medium text-black/80">
          <span>Available Subject</span>
          <select
            className="w-full border px-2 py-2 rounded font-normal"
            value={subjectId}
            onChange={e=>setSubjectId(e.target.value)}
            disabled={!availableSubjects.length}
          >
            <option value="">Select subject</option>
            {availableSubjects.map(s=> <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </label>
        <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
          <button onClick={add} className="px-3 py-1 bg-orange-500 text-white rounded">Assign</button>
        </div>
      </div>
    </div>
  );
}

export default ClassesPage;
