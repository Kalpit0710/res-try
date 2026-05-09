import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/clientApi';

// ── Skeleton shimmer ─────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-black/[0.06] ${className}`} />
  );
}

function StatCard(props: { label: string; value: number; accent: string; hint?: string; loading?: boolean }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <div className="text-xs uppercase tracking-wide text-black/50">{props.label}</div>
      {props.loading ? (
        <Skeleton className="mt-2 h-9 w-20" />
      ) : (
        <div className={`mt-2 text-3xl font-bold ${props.accent}`}>{props.value}</div>
      )}
      {props.hint ? <div className="mt-1 text-xs text-black/50">{props.hint}</div> : null}
    </div>
  );
}

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await apiClient.getDashboardStats();
      setStats(res.data ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeLocks = useMemo(() => (stats?.locks ?? []).filter((l: any) => l.isLocked).length, [stats]);
  const unlockedLocks = useMemo(() => (stats?.locks ?? []).filter((l: any) => !l.isLocked).length, [stats]);

  return (
    <div className="p-4 pb-24 sm:p-6 md:pb-6 space-y-6">
      <div className="rounded-3xl border border-black/10 bg-[radial-gradient(ellipse_at_top_left,_#fff7ed,_#ffffff_45%,_#ecfeff)] p-4 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.07)]">
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
          <StatCard loading={loading} label="Students" value={stats?.studentsTotal ?? 0} accent="text-orange-700" hint="All registered students" />
          <StatCard loading={loading} label="Classes" value={stats?.classesCount ?? 0} accent="text-cyan-700" hint="Configured class groups" />
          <StatCard loading={loading} label="Subjects" value={stats?.subjectsCount ?? 0} accent="text-emerald-700" hint="Mapped to classes" />
          <StatCard loading={loading} label="Teachers" value={stats?.teachersCount ?? 0} accent="text-rose-700" hint="Available for marks entry" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_8px_25px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold">Recent Activity</h3>
            <Link to="/admin/logs" className="text-sm text-orange-700 hover:underline">View all logs</Link>
          </div>
          <div className="mt-3 divide-y divide-black/5">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="py-3 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-72" />
                </div>
              ))
            ) : (stats?.recentLogs ?? []).length ? (
              (stats.recentLogs as any[]).map((log: any) => (
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
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-red-50 p-3">
              <div className="text-xs uppercase text-red-700/80">Locked</div>
              {loading ? <Skeleton className="mt-1 h-8 w-12" /> : <div className="mt-1 text-2xl font-bold text-red-700">{activeLocks}</div>}
            </div>
            <div className="rounded-xl bg-green-50 p-3">
              <div className="text-xs uppercase text-green-700/80">Unlocked</div>
              {loading ? <Skeleton className="mt-1 h-8 w-12" /> : <div className="mt-1 text-2xl font-bold text-green-700">{unlockedLocks}</div>}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
              : (stats?.locks ?? []).slice(0, 6).map((lock: any) => (
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
            {!loading && !(stats?.locks ?? []).length ? <div className="text-sm text-black/50">No locks configured.</div> : null}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link to="/admin/settings" className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white">Manage Locks</Link>
            <Link to="/admin/reports" className="rounded-lg border border-black/15 px-3 py-2 text-sm font-medium text-black">Generate Reports</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
