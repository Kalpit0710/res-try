import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../lib/clientApi';

const LOCK_TYPES = ['system', 'class', 'student', 'teacher'] as const;

export function SettingsPage() {
  const [locks, setLocks] = useState<any[]>([]);
  const [type, setType] = useState<(typeof LOCK_TYPES)[number]>('system');
  const [referenceId, setReferenceId] = useState('global');
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await apiClient.getLocks();
    setLocks(res.data ?? []);
  }

  useEffect(() => { load(); }, []);

  const existing = useMemo(() => locks.find((lock) => lock.type === type && lock.referenceId === referenceId), [locks, type, referenceId]);

  async function toggleLock(nextLocked: boolean) {
    setBusy(true);
    try {
      if (existing) {
        await apiClient.updateLock(existing._id, { isLocked: nextLocked });
      } else {
        await apiClient.createLock({ type, referenceId, isLocked: nextLocked });
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function removeLock(id: string) {
    if (!confirm('Delete this lock?')) return;
    await apiClient.deleteLock(id);
    load();
  }

  return (
    <div className="p-6">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-black/60">Manage system/class/student/teacher locks.</p>
      </div>

      <div className="mt-6 grid gap-4 rounded-lg border border-black/10 p-4 md:grid-cols-4">
        <label className="space-y-1">
          <div className="text-sm font-medium">Lock type</div>
          <select className="w-full rounded-md border border-black/15 px-3 py-2" value={type} onChange={(e) => setType(e.target.value as any)}>
            {LOCK_TYPES.map((lockType) => <option key={lockType} value={lockType}>{lockType}</option>)}
          </select>
        </label>

        <label className="space-y-1 md:col-span-2">
          <div className="text-sm font-medium">Reference ID</div>
          <input className="w-full rounded-md border border-black/15 px-3 py-2" value={referenceId} onChange={(e) => setReferenceId(e.target.value)} placeholder="Enter global, classId, studentId, or teacher name" />
        </label>

        <div className="flex items-end gap-2">
          <button disabled={busy} onClick={() => toggleLock(true)} className="rounded-md bg-orange-500 px-4 py-2 text-white disabled:opacity-60">
            Lock
          </button>
          <button disabled={busy} onClick={() => toggleLock(false)} className="rounded-md border border-black/15 px-4 py-2 disabled:opacity-60">
            Unlock
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-black/10">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {locks.map((lock) => (
              <tr key={lock._id} className="border-t border-black/5">
                <td className="px-4 py-3">{lock.type}</td>
                <td className="px-4 py-3">{lock.referenceId}</td>
                <td className="px-4 py-3">
                  <span className={lock.isLocked ? 'rounded-full bg-red-50 px-2 py-1 text-red-700' : 'rounded-full bg-green-50 px-2 py-1 text-green-700'}>
                    {lock.isLocked ? 'Locked' : 'Unlocked'}
                  </span>
                </td>
                <td className="px-4 py-3">{lock.updatedAt ? new Date(lock.updatedAt).toLocaleString() : '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => toggleLock(!lock.isLocked)} className="text-orange-600">
                      {lock.isLocked ? 'Unlock' : 'Lock'}
                    </button>
                    <button onClick={() => removeLock(lock._id)} className="text-red-600">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!locks.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-black/50" colSpan={5}>
                  No locks configured yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SettingsPage;
