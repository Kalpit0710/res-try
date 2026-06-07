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
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [showBulk, setShowBulk] = useState(false);

  async function loadStudents(pageToLoad: number, searchTerm: string) {
    setLoading(true);
    try {
      const res = await apiClient.getStudents({ page: pageToLoad, limit, search: searchTerm });
      setStudents(res.data);
      setTotal(res.total ?? 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents(page, query);
  }, [page, query]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Students</h2>
          <p className="mt-1 text-sm text-slate-500">Manage student master data, bulk upload, and assignments.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or reg no..."
              className="w-full sm:w-72 rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowBulk(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              Bulk Upload
            </button>
            <button onClick={() => setEditing({})} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Add Student
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full table-auto border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Reg No</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Roll No</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 animate-pulse rounded-full bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No students found. {query && 'Try adjusting your search query.'}
                  </td>
                </tr>
              ) : students.map((s) => (
                <tr key={s._id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-900">{s.regNo}</td>
                  <td className="px-6 py-4 text-slate-700">{s.name}</td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                      {s.classId?.name ?? 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{s.rollNo ?? '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setEditing(s)} className="inline-flex h-8 items-center justify-center rounded-lg bg-orange-50 px-3 text-xs font-semibold text-orange-700 transition-colors hover:bg-orange-100">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-4">
          <div className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-900">{students.length}</span> of <span className="font-medium text-slate-900">{total}</span> students
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={!canGoPrev} 
              onClick={() => setPage((p) => Math.max(1, p - 1))} 
              className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex h-8 min-w-[2rem] items-center justify-center rounded-lg bg-slate-100 px-2 text-sm font-medium text-slate-700">
              {page}
            </div>
            <button 
              disabled={!canGoNext} 
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))} 
              className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
            >
              Next
            </button>
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
