import { useEffect, useState } from 'react';
import { apiClient } from '../lib/clientApi';

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [activeClassId, setActiveClassId] = useState('all');

  async function load() { const res = await apiClient.getSubjects(); setSubjects(res.data ?? res); }
  useEffect(()=>{ load(); apiClient.getClasses().then(r=>setClasses(r.data??r)); }, []);

  async function remove(id: string) { if (!confirm('Delete subject?')) return; await apiClient.deleteSubject(id); load(); }

  function subjectClassId(subject: any) {
    return subject.classId?._id ?? subject.classId ?? '';
  }

  function subjectClassName(subject: any) {
    return subject.classId?.name ?? classes.find((c) => c._id === subject.classId?._id || c._id === subject.classId)?.name ?? 'Unlinked';
  }

  const groupedSubjects = classes
    .map((cls) => ({
      classId: cls._id,
      className: cls.name,
      items: subjects.filter((subject) => subjectClassId(subject) === cls._id),
    }))
    .filter((group) => activeClassId === 'all' || group.classId === activeClassId);

  const unlinkedSubjects = subjects.filter((subject) => !subjectClassId(subject));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Subjects</h2>
          <p className="text-sm text-black/60">Manage subjects and max marks, grouped by linked class</p>
        </div>
        <div>
          <button onClick={() => setEditing({})} className="rounded-md bg-orange-500 text-white px-3 py-2">Add Subject</button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveClassId('all')}
          className={['rounded-full px-3 py-1.5 text-sm border', activeClassId === 'all' ? 'bg-black text-white border-black' : 'bg-white border-black/10'].join(' ')}
        >
          All Classes
        </button>
        {classes.map((cls) => (
          <button
            key={cls._id}
            onClick={() => setActiveClassId(cls._id)}
            className={['rounded-full px-3 py-1.5 text-sm border', activeClassId === cls._id ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border-black/10'].join(' ')}
          >
            {cls.name}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-6">
        {groupedSubjects.map((group) => (
          <div key={group.classId} className="rounded-lg border border-black/10 bg-white overflow-hidden">
            <div className="border-b border-black/10 bg-black/[0.02] px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{group.className}</h3>
                <p className="text-xs text-black/55">{group.items.length} subject{group.items.length === 1 ? '' : 's'} linked</p>
              </div>
              <span className="text-xs rounded-full bg-orange-50 text-orange-700 px-2 py-1">Linked</span>
            </div>

            <div className="divide-y divide-black/5">
              {group.items.length === 0 ? (
                <div className="px-4 py-6 text-sm text-black/50">No subjects linked to this class yet.</div>
              ) : (
                group.items.map((s) => (
                  <div key={s._id} className="p-4">
                    <div className="flex justify-between items-center gap-4">
                      <div>
                        <div className="font-semibold">{s.name} <span className="text-sm text-black/60">({subjectClassName(s)})</span></div>
                        <div className="text-sm text-black/60">Max T1: {s.maxMarks?.term1 && Object.values(s.maxMarks.term1).join('/')}</div>
                        <div className="text-sm text-black/60">Max T2: {s.maxMarks?.term2 && Object.values(s.maxMarks.term2).join('/')}</div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => setEditing(s)} className="text-orange-600">Edit</button>
                        <button onClick={() => remove(s._id)} className="text-red-600">Delete</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

        {unlinkedSubjects.length > 0 && (activeClassId === 'all' || activeClassId === '') && (
          <div className="rounded-lg border border-dashed border-black/15 bg-white">
            <div className="border-b border-black/10 bg-black/[0.02] px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Unlinked Subjects</h3>
                <p className="text-xs text-black/55">Subjects without a class assignment</p>
              </div>
              <span className="text-xs rounded-full bg-black/5 text-black/65 px-2 py-1">Review</span>
            </div>
            <div className="divide-y divide-black/5">
              {unlinkedSubjects.map((s) => (
                <div key={s._id} className="p-4">
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <div className="font-semibold">{s.name} <span className="text-sm text-black/60">(—)</span></div>
                      <div className="text-sm text-black/60">Max T1: {s.maxMarks?.term1 && Object.values(s.maxMarks.term1).join('/')}</div>
                      <div className="text-sm text-black/60">Max T2: {s.maxMarks?.term2 && Object.values(s.maxMarks.term2).join('/')}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setEditing(s)} className="text-orange-600">Edit</button>
                      <button onClick={() => remove(s._id)} className="text-red-600">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
          <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
            <span>Subject Name</span>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter subject name like Mathematics" className="border px-2 py-2 rounded font-normal" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
            <span>Class</span>
            <select value={classId} onChange={e=>setClassId(e.target.value)} className="border px-2 py-2 rounded font-normal" title="Choose the class this subject belongs to">
              <option value="">Select class</option>
              {classes.map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <div className="font-semibold">Term 1 Max Marks</div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
                <span>Periodic Test</span>
                <input type="number" value={maxT1.periodicTest} onChange={e=>setMaxT1(s=>({...s, periodicTest: Number(e.target.value)}))} className="border px-2 py-2 rounded font-normal" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
                <span>Notebook</span>
                <input type="number" value={maxT1.notebook} onChange={e=>setMaxT1(s=>({...s, notebook: Number(e.target.value)}))} className="border px-2 py-2 rounded font-normal" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
                <span>Sub Enrichment</span>
                <input type="number" value={maxT1.subEnrichment} onChange={e=>setMaxT1(s=>({...s, subEnrichment: Number(e.target.value)}))} className="border px-2 py-2 rounded font-normal" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
                <span>Half Yearly Exam</span>
                <input type="number" value={maxT1.halfYearlyExam} onChange={e=>setMaxT1(s=>({...s, halfYearlyExam: Number(e.target.value)}))} className="border px-2 py-2 rounded font-normal" />
              </label>
            </div>
          </div>
          <div>
            <div className="font-semibold">Term 2 Max Marks</div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
                <span>Periodic Test</span>
                <input type="number" value={maxT2.periodicTest} onChange={e=>setMaxT2(s=>({...s, periodicTest: Number(e.target.value)}))} className="border px-2 py-2 rounded font-normal" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
                <span>Notebook</span>
                <input type="number" value={maxT2.notebook} onChange={e=>setMaxT2(s=>({...s, notebook: Number(e.target.value)}))} className="border px-2 py-2 rounded font-normal" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
                <span>Sub Enrichment</span>
                <input type="number" value={maxT2.subEnrichment} onChange={e=>setMaxT2(s=>({...s, subEnrichment: Number(e.target.value)}))} className="border px-2 py-2 rounded font-normal" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
                <span>Yearly Exam</span>
                <input type="number" value={maxT2.yearlyExam} onChange={e=>setMaxT2(s=>({...s, yearlyExam: Number(e.target.value)}))} className="border px-2 py-2 rounded font-normal" />
              </label>
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
