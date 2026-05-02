import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/clientApi';

function StatCard(props: { label: string; value: number; accent: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <div className="text-xs uppercase tracking-wide text-black/50">{props.label}</div>
      <div className={`mt-2 text-3xl font-bold ${props.accent}`}>{props.value}</div>
      {props.hint ? <div className="mt-1 text-xs text-black/50">{props.hint}</div> : null}
    </div>
  );
}

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [studentsTotal, setStudentsTotal] = useState(0);
  const [classesCount, setClassesCount] = useState(0);
  const [subjectsCount, setSubjectsCount] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);
  const [locks, setLocks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  async function load() {
    setLoading(true);
    try {
      const [students, classesRes, subjectsRes, teachersRes, locksRes, logsRes] = await Promise.all([
        apiClient.getStudents({ page: 1, limit: 1 }),
        apiClient.getClasses(),
        apiClient.getSubjects(),
        apiClient.getTeachers(),
        apiClient.getLocks(),
        apiClient.getLogs(),
      ]);

      setStudentsTotal(students.total ?? 0);
      setClassesCount((classesRes.data ?? []).length);
      setSubjectsCount((subjectsRes.data ?? []).length);
      setTeachersCount((teachersRes.data ?? []).length);
      setLocks(locksRes.data ?? []);
      setLogs((logsRes.data ?? []).slice(0, 6));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeLocks = useMemo(() => locks.filter((lock) => lock.isLocked).length, [locks]);
  const unlockedLocks = useMemo(() => locks.filter((lock) => !lock.isLocked).length, [locks]);

  return (
    <div className="p-6 pb-24 md:pb-6">
      <div className="rounded-3xl border border-black/10 bg-[radial-gradient(ellipse_at_top_left,_#fff7ed,_#ffffff_45%,_#ecfeff)] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.07)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
            <p className="mt-1 text-sm text-black/60">
              Live snapshot of students, staff, locks, and recent updates in SRMS.
            </p>
          </div>
          <button
            onClick={load}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/85"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Students" value={studentsTotal} accent="text-orange-700" hint="All registered students" />
          <StatCard label="Classes" value={classesCount} accent="text-cyan-700" hint="Configured class groups" />
          <StatCard label="Subjects" value={subjectsCount} accent="text-emerald-700" hint="Mapped to classes" />
          <StatCard label="Teachers" value={teachersCount} accent="text-rose-700" hint="Available for marks entry" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_8px_25px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Recent Activity</h3>
            <Link to="/admin/logs" className="text-sm text-orange-700 hover:underline">View all logs</Link>
          </div>
          <div className="mt-3 divide-y divide-black/5">
            {logs.length ? (
              logs.map((log) => (
                <div key={log._id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium text-black">{log.action}</div>
                    <div className="text-xs text-black/50">{new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="mt-1 text-xs text-black/60">
                    Teacher: {log.teacherName} | Student: {log.studentId?.name ?? '-'} | Subject: {log.subjectId?.name ?? '-'}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-sm text-black/50">No activity yet.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_8px_25px_rgba(0,0,0,0.05)]">
          <h3 className="text-base font-semibold">Locks Overview</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-red-50 p-3">
              <div className="text-xs uppercase text-red-700/80">Locked</div>
              <div className="mt-1 text-2xl font-bold text-red-700">{activeLocks}</div>
            </div>
            <div className="rounded-xl bg-green-50 p-3">
              <div className="text-xs uppercase text-green-700/80">Unlocked</div>
              <div className="mt-1 text-2xl font-bold text-green-700">{unlockedLocks}</div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {locks.slice(0, 6).map((lock) => (
              <div key={lock._id} className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{lock.type}</span>
                  <span className="text-black/55"> / {lock.referenceId}</span>
                </div>
                <span className={lock.isLocked ? 'text-red-700' : 'text-green-700'}>
                  {lock.isLocked ? 'Locked' : 'Unlocked'}
                </span>
              </div>
            ))}
            {!locks.length ? <div className="text-sm text-black/50">No locks configured.</div> : null}
          </div>

          <div className="mt-4 flex gap-2">
            <Link to="/admin/settings" className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white">Manage Locks</Link>
            <Link to="/admin/reports" className="rounded-lg border border-black/15 px-3 py-2 text-sm font-medium text-black">Generate Reports</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
