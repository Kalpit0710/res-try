import { useEffect, useState } from 'react';
import { apiClient } from '../lib/clientApi';
import { StudentForm } from '../components/StudentForm';
import { BulkUpload } from '../components/BulkUpload';

export function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [showBulk, setShowBulk] = useState(false);

  async function loadStudents(pageToLoad: number, searchTerm: string) {
    const res = await apiClient.getStudents({ page: pageToLoad, limit, search: searchTerm });
    setStudents(res.data);
    setTotal(res.total ?? 0);
  }

  useEffect(() => {
    loadStudents(page, query);
  }, [page, query]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Students</h2>
          <p className="text-sm text-black/60">Manage student master data</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
            <span>Search Students</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students by name or regNo"
              className="w-full rounded-md border px-3 py-2 font-normal sm:w-72"
            />
          </label>
          <button onClick={() => setShowBulk(true)} className="rounded-md bg-orange-500 px-3 py-2 text-white">Bulk Upload</button>
          <button onClick={() => setEditing({})} className="rounded-md border px-3 py-2">Add Student</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="min-w-[720px] w-full table-auto border-collapse">
          <thead>
            <tr className="text-left text-sm text-black/70">
              <th className="p-2">Reg No</th>
              <th className="p-2">Name</th>
              <th className="p-2">Class</th>
              <th className="p-2">Roll No</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s._id} className="border-t">
                <td className="p-2">{s.regNo}</td>
                <td className="p-2">{s.name}</td>
                <td className="p-2">{s.classId?.name ?? '-'}</td>
                <td className="p-2">{s.rollNo ?? '-'}</td>
                <td className="p-2">
                  <button onClick={() => setEditing(s)} className="mr-2 text-sm text-orange-600">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-black/60">Showing {students.length} of {total} students</div>
          <div className="flex gap-2 items-center">
            <button disabled={!canGoPrev} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            <div className="px-3 py-1">Page {page} of {totalPages}</div>
            <button disabled={!canGoNext} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {editing !== null && (
        <StudentForm student={editing} onClose={() => { setEditing(null); loadStudents(page, query); }} />
      )}

      {showBulk && (
        <BulkUpload onClose={() => { setShowBulk(false); loadStudents(page, query); }} />
      )}
    </div>
  );
}

export default StudentsPage;
