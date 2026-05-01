import { useEffect, useState } from 'react';
import { apiClient } from '../lib/clientApi';

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [classes, setClasses] = useState<any[]>([]);

  async function load() { const res = await apiClient.getSubjects(); setSubjects(res.data ?? res); }
  useEffect(()=>{ load(); apiClient.getClasses().then(r=>setClasses(r.data??r)); }, []);

  async function remove(id: string) { if (!confirm('Delete subject?')) return; await apiClient.deleteSubject(id); load(); }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Subjects</h2>
          <p className="text-sm text-black/60">Manage subjects and max marks</p>
        </div>
        <div>
          <button onClick={() => setEditing({})} className="rounded-md bg-orange-500 text-white px-3 py-2">Add Subject</button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {subjects.map(s => (
          <div key={s._id} className="border p-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{s.name} <span className="text-sm text-black/60">({s.classId?.name ?? '—'})</span></div>
                <div className="text-sm text-black/60">Max T1: {s.maxMarks?.term1 && Object.values(s.maxMarks.term1).join('/')}</div>
                <div className="text-sm text-black/60">Max T2: {s.maxMarks?.term2 && Object.values(s.maxMarks.term2).join('/')}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(s)} className="text-orange-600">Edit</button>
                <button onClick={() => remove(s._id)} className="text-red-600">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing !== null && <SubjectForm subject={editing} classes={classes} onClose={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function SubjectForm({ subject = {}, classes = [], onClose }: { subject?: any; classes: any[]; onClose: () => void }) {
  const [name, setName] = useState(subject.name ?? '');
  const [classId, setClassId] = useState(subject.classId?._id ?? subject.classId ?? '');
  const [maxT1, setMaxT1] = useState({ periodicTest: subject.maxMarks?.term1?.periodicTest ?? 10, notebook: subject.maxMarks?.term1?.notebook ?? 5, subEnrichment: subject.maxMarks?.term1?.subEnrichment ?? 5, halfYearlyExam: subject.maxMarks?.term1?.halfYearlyExam ?? 30 });
  const [maxT2, setMaxT2] = useState({ periodicTest: subject.maxMarks?.term2?.periodicTest ?? 10, notebook: subject.maxMarks?.term2?.notebook ?? 5, subEnrichment: subject.maxMarks?.term2?.subEnrichment ?? 5, yearlyExam: subject.maxMarks?.term2?.yearlyExam ?? 30 });
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const body = { name, classId, maxMarks: { term1: maxT1, term2: maxT2 } };
      if (subject && subject._id) await apiClient.updateSubject(subject._id, body); else await apiClient.createSubject(body);
      onClose();
    } catch (err: unknown) { alert((err as Error)?.message ?? 'Failed'); } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-md p-6 w-full max-w-2xl">
        <h3 className="text-lg font-semibold">{subject._id ? 'Edit' : 'Add'} Subject</h3>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter subject name like Mathematics" className="border px-2 py-2 rounded" />
          <select value={classId} onChange={e=>setClassId(e.target.value)} className="border px-2 py-2 rounded" title="Choose the class this subject belongs to">
            <option value="">Select class</option>
            {classes.map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <div className="font-semibold">Term 1 Max Marks</div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input type="number" value={maxT1.periodicTest} onChange={e=>setMaxT1(s=>({...s, periodicTest: Number(e.target.value)}))} className="border px-2 py-2 rounded" />
              <input type="number" value={maxT1.notebook} onChange={e=>setMaxT1(s=>({...s, notebook: Number(e.target.value)}))} className="border px-2 py-2 rounded" />
              <input type="number" value={maxT1.subEnrichment} onChange={e=>setMaxT1(s=>({...s, subEnrichment: Number(e.target.value)}))} className="border px-2 py-2 rounded" />
              <input type="number" value={maxT1.halfYearlyExam} onChange={e=>setMaxT1(s=>({...s, halfYearlyExam: Number(e.target.value)}))} className="border px-2 py-2 rounded" />
            </div>
          </div>
          <div>
            <div className="font-semibold">Term 2 Max Marks</div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input type="number" value={maxT2.periodicTest} onChange={e=>setMaxT2(s=>({...s, periodicTest: Number(e.target.value)}))} className="border px-2 py-2 rounded" />
              <input type="number" value={maxT2.notebook} onChange={e=>setMaxT2(s=>({...s, notebook: Number(e.target.value)}))} className="border px-2 py-2 rounded" />
              <input type="number" value={maxT2.subEnrichment} onChange={e=>setMaxT2(s=>({...s, subEnrichment: Number(e.target.value)}))} className="border px-2 py-2 rounded" />
              <input type="number" value={maxT2.yearlyExam} onChange={e=>setMaxT2(s=>({...s, yearlyExam: Number(e.target.value)}))} className="border px-2 py-2 rounded" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
          <button onClick={save} disabled={loading} className="px-3 py-1 bg-orange-500 text-white rounded">Save</button>
        </div>
      </div>
    </div>
  );
}

export default SubjectsPage;
