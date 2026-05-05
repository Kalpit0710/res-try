import { useEffect, useState } from 'react';
import { apiClient } from '../lib/clientApi';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await apiClient.getTeachers();
      setTeachers(res.data ?? res);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm('Delete teacher?')) return;
    await apiClient.deleteTeacher(id);
    load();
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Teachers</h2>
          <p className="text-sm text-black/60">Manage teachers and link them to classes</p>
        </div>
        <div>
          <button onClick={() => setEditing({})} className="rounded-md bg-orange-500 text-white px-3 py-2">Add Teacher</button>
        </div>
      </div>

      <div className="mt-4">
        <ul className="space-y-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <li key={index} className="rounded-lg border bg-white p-3">
                <LoadingSkeleton className="h-5 w-48 mb-2" />
                <LoadingSkeleton className="h-4 w-32" />
              </li>
            ))
          ) : teachers.length ? (
            teachers.map(t => (
              <li key={t._id} className="rounded-lg border bg-white p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="font-medium">{t.name}</div>
                  {t.classId && <div className="text-xs text-black/60">Class: {typeof t.classId === 'object' ? t.classId.name : t.classId}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(t)} className="text-orange-600">Edit</button>
                  <button onClick={() => remove(t._id)} className="text-red-600">Delete</button>
                </div>
              </li>
            ))
          ) : (
            <li className="rounded-lg border bg-white p-6 text-center text-sm text-black/50">No teachers available.</li>
          )}
        </ul>
      </div>

      {editing !== null && <TeacherForm teacher={editing} onClose={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function TeacherForm({ teacher = {}, onClose }: { teacher?: any; onClose: () => void }) {
  const [name, setName] = useState(teacher.name ?? '');
  const [classId, setClassId] = useState(teacher.classId?._id ?? teacher.classId ?? '');
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.publicGetClasses().then(res => setClasses(res.data ?? res));
  }, []);

  async function save() {
    setLoading(true);
    try {
      const data: any = { name };
      if (classId) data.classId = classId;
      if (teacher && teacher._id) {
        await apiClient.updateTeacher(teacher._id, data);
      } else {
        await apiClient.createTeacher(data);
      }
      onClose();
    } catch (err: unknown) {
      alert((err as Error)?.message ?? 'Failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-6">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <h3 className="text-lg font-semibold">{teacher._id ? 'Edit' : 'Add'} Teacher</h3>
        
        <label className="mt-3 flex flex-col gap-1 text-sm font-medium text-black/80">
          <span>Teacher Name</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter teacher name" className="w-full border px-2 py-2 rounded font-normal" />
        </label>

        <label className="mt-3 flex flex-col gap-1 text-sm font-medium text-black/80">
          <span>Linked Class</span>
          <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full border px-2 py-2 rounded font-normal">
            <option value="">Select a class (optional)</option>
            {classes.map(cls => (
              <option key={cls._id} value={cls._id}>{cls.name}</option>
            ))}
          </select>
          <span className="text-xs text-black/60">Teachers linked to a class will have their signature used for that class's results</span>
        </label>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
          <button onClick={save} disabled={loading} className="px-3 py-1 bg-orange-500 text-white rounded">Save</button>
        </div>
      </div>
    </div>
  );
}
