import { useEffect, useState } from 'react';
import { apiClient } from '../lib/clientApi';

export function StudentForm({ student = {}, onClose }: { student?: any; onClose: () => void }) {
  const [form, setForm] = useState({ regNo: '', name: '', classId: '', rollNo: '', fatherName: '', motherName: '' });
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student && student._id) setForm({ regNo: student.regNo ?? '', name: student.name ?? '', classId: student.classId?._id ?? student.classId ?? '', rollNo: student.rollNo ?? '', fatherName: student.fatherName ?? '', motherName: student.motherName ?? '' });
  }, [student]);

  useEffect(() => {
    async function loadClasses() {
      try {
        const data = await apiClient.getClasses();
        setClasses(data.data ?? data);
      } catch (err) {
        console.error('Unable to load classes', err);
      }
    }

    loadClasses();
  }, []);

  async function save() {
    setLoading(true);
    try {
      if (student && student._id) {
        await apiClient.updateStudent(student._id, form);
      } else {
        await apiClient.createStudent(form);
      }
      onClose();
    } catch (err: unknown) {
      alert((err as Error)?.message ?? 'Save failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-6">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <h3 className="text-lg font-semibold mb-2">{student && student._id ? 'Edit' : 'Add'} Student</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
            <span>Admission / Registration No.</span>
            <input value={form.regNo} onChange={e => setForm(f=>({...f, regNo: e.target.value}))} placeholder="Enter admission / registration number" className="border px-2 py-2 rounded font-normal" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
            <span>Student Name</span>
            <input value={form.name} onChange={e => setForm(f=>({...f, name: e.target.value}))} placeholder="Enter student full name" className="border px-2 py-2 rounded font-normal" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
            <span>Class</span>
            <select value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))} className="border px-2 py-2 rounded font-normal">
              <option value="">Select class</option>
              {classes.map((cls) => (
                <option key={cls._id ?? cls.id} value={cls._id ?? cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
            <span>Roll No.</span>
            <input value={form.rollNo} onChange={e => setForm(f=>({...f, rollNo: e.target.value}))} placeholder="Enter roll number" className="border px-2 py-2 rounded font-normal" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-black/80 sm:col-span-2">
            <span>Father's Name</span>
            <input value={form.fatherName} onChange={e => setForm(f=>({...f, fatherName: e.target.value}))} placeholder="Enter father's name" className="border px-2 py-2 rounded font-normal" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-black/80 sm:col-span-2">
            <span>Mother's Name</span>
            <input value={form.motherName} onChange={e => setForm(f=>({...f, motherName: e.target.value}))} placeholder="Enter mother's name" className="border px-2 py-2 rounded font-normal" />
          </label>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="px-3 py-2 border rounded-md">Cancel</button>
          <button onClick={save} disabled={loading} className="px-3 py-2 bg-orange-500 text-white rounded-md">{loading ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

export default StudentForm;
