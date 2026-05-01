import { useMemo, useState } from 'react';
import { apiClient } from '../lib/clientApi';

export function ReportsPage() {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function searchStudents() {
    setLoading(true);
    try {
      const res = await apiClient.getStudents({ page: 1, limit: 20, search });
      setStudents(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function openPdf(studentId: string, download = false) {
    const blob = await apiClient.getStudentReportPdf(studentId);
    const url = URL.createObjectURL(blob);
    if (download) {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report-card.pdf';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
  }

  const previewStudent = useMemo(() => students[0], [students]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">Reports</h2>
          <p className="text-sm text-black/60">Search a student and preview or download the PDF report card.</p>
        </div>

        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or regNo"
            className="rounded-md border border-black/15 px-3 py-2 min-w-64"
          />
          <button onClick={searchStudents} className="rounded-md bg-orange-500 text-white px-4 py-2">
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border border-black/10 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left">
              <tr>
                <th className="px-4 py-3">Reg No</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id} className="border-t border-black/5">
                  <td className="px-4 py-3">{student.regNo}</td>
                  <td className="px-4 py-3">{student.name}</td>
                  <td className="px-4 py-3">{student.classId?.name ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openPdf(student._id)} className="text-orange-600">
                        Preview
                      </button>
                      <button onClick={() => openPdf(student._id, true)} className="text-black/70">
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!students.length ? (
                <tr>
                  <td className="px-4 py-8 text-center text-black/50" colSpan={4}>
                    Search for a student to generate a report.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="border border-black/10 rounded-lg p-4 min-h-[70vh]">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Preview</h3>
            {previewStudent ? <span className="text-sm text-black/60">{previewStudent.name}</span> : null}
          </div>

          {previewUrl ? (
            <iframe title="Report Preview" src={previewUrl} className="mt-4 h-[62vh] w-full rounded border border-black/10" />
          ) : (
            <div className="mt-4 rounded border border-dashed border-black/15 p-6 text-sm text-black/50">
              Generate a report preview from the table on the left.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
