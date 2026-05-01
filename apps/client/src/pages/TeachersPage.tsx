import { useEffect, useState } from 'react';
import { apiClient } from '../lib/clientApi';

export function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  async function load() { const res = await apiClient.getTeachers(); setTeachers(res.data ?? res); }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm('Delete teacher?')) return;
    await apiClient.deleteTeacher(id);
    load();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Teachers</h2>
          <p className="text-sm text-black/60">Manage teachers</p>
        </div>
        <div>
          <button onClick={() => setEditing({})} className="rounded-md bg-orange-500 text-white px-3 py-2">Add Teacher</button>
        </div>
      </div>

      <div className="mt-4">
        <ul className="space-y-2">
          {teachers.map(t => (
            <li key={t._id} className="border p-2 flex justify-between items-center">
              <div>{t.name}</div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(t)} className="text-orange-600">Edit</button>
                <button onClick={() => remove(t._id)} className="text-red-600">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {editing !== null && <TeacherForm teacher={editing} onClose={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function TeacherForm({ teacher = {}, onClose }: { teacher?: any; onClose: () => void }) {
  const [name, setName] = useState(teacher.name ?? '');
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      if (teacher && teacher._id) await apiClient.updateTeacher(teacher._id, { name }); else await apiClient.createTeacher({ name });
      onClose();
    } catch (err: unknown) {
      alert((err as Error)?.message ?? 'Failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-md p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold">{teacher._id ? 'Edit' : 'Add'} Teacher</h3>
        <label className="mt-3 flex flex-col gap-1 text-sm font-medium text-black/80">
          <span>Teacher Name</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter teacher name" className="w-full border px-2 py-2 rounded font-normal" />
        </label>
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
          <button onClick={save} disabled={loading} className="px-3 py-1 bg-orange-500 text-white rounded">Save</button>
        </div>
      </div>
    </div>
  );
}

export default TeachersPage;
