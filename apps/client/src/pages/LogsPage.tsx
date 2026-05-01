import { useEffect, useState } from 'react';
import { apiClient } from '../lib/clientApi';

export function LogsPage() {
  const [teacherName, setTeacherName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await apiClient.getLogs({ teacherName, studentId, subjectId, from, to });
      setLogs(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">Logs</h2>
          <p className="text-sm text-black/60">Filter activity logs by teacher, student, subject, and date range.</p>
        </div>
        <button onClick={load} className="rounded-md bg-orange-500 text-white px-4 py-2">
          {loading ? 'Loading…' : 'Apply Filters'}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} placeholder="Filter by teacher name" className="rounded-md border border-black/15 px-3 py-2" />
        <input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Filter by student ID" className="rounded-md border border-black/15 px-3 py-2" />
        <input value={subjectId} onChange={(e) => setSubjectId(e.target.value)} placeholder="Filter by subject ID" className="rounded-md border border-black/15 px-3 py-2" />
        <input value={from} onChange={(e) => setFrom(e.target.value)} type="date" className="rounded-md border border-black/15 px-3 py-2" />
        <input value={to} onChange={(e) => setTo(e.target.value)} type="date" className="rounded-md border border-black/15 px-3 py-2" />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-black/10">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Teacher</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Subject</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id} className="border-t border-black/5">
                <td className="px-4 py-3">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="px-4 py-3">{log.teacherName}</td>
                <td className="px-4 py-3">{log.action}</td>
                <td className="px-4 py-3">{log.studentId?.name ?? log.studentId ?? '-'}</td>
                <td className="px-4 py-3">{log.subjectId?.name ?? log.subjectId ?? '-'}</td>
              </tr>
            ))}
            {!logs.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-black/50" colSpan={5}>
                  No log entries found for the selected filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LogsPage;
