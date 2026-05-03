import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../lib/clientApi';

const LOCK_TYPES = ['system', 'class', 'student', 'teacher'] as const;
const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/api\/v1\/?$/, '') ?? 'http://localhost:5000').replace(/\/$/, '');

function assetUrl(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function SettingsPage() {
  const [locks, setLocks] = useState<any[]>([]);
  const [branding, setBranding] = useState<any | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [type, setType] = useState<(typeof LOCK_TYPES)[number]>('system');
  const [referenceId, setReferenceId] = useState('global');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [principalSignatureFile, setPrincipalSignatureFile] = useState<File | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [teacherSignatureFile, setTeacherSignatureFile] = useState<File | null>(null);
  const [teacherUploading, setTeacherUploading] = useState(false);

  async function load() {
    const [locksRes, brandingRes, teachersRes] = await Promise.all([apiClient.getLocks(), apiClient.getBranding(), apiClient.getTeachers()]);
    setLocks(locksRes.data ?? []);
    setBranding(brandingRes.data ?? null);
    setTeachers(teachersRes.data ?? []);
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

  async function toggleRowLock(lock: any) {
    setBusy(true);
    try {
      await apiClient.updateLock(lock._id, { isLocked: !lock.isLocked });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function uploadBranding() {
    if (!logoFile && !principalSignatureFile) {
      alert('Select logo and/or principal signature to upload.');
      return;
    }

    setUploading(true);
    try {
      await apiClient.uploadBrandingAssets({
        logo: logoFile,
        principalSignature: principalSignatureFile,
      });
      setLogoFile(null);
      setPrincipalSignatureFile(null);
      await load();
    } finally {
      setUploading(false);
    }
  }

  async function uploadTeacherSignature() {
    if (!selectedTeacherId) {
      alert('Select a teacher first.');
      return;
    }
    if (!teacherSignatureFile) {
      alert('Select a signature image file.');
      return;
    }

    setTeacherUploading(true);
    try {
      await apiClient.uploadTeacherSignature(selectedTeacherId, teacherSignatureFile);
      setTeacherSignatureFile(null);
      await load();
    } finally {
      setTeacherUploading(false);
    }
  }

  async function removeAsset(assetKey: 'logo' | 'principalSignature') {
    if (!confirm('Remove this asset?')) return;
    await apiClient.removeBrandingAsset(assetKey);
    await load();
  }

  async function removeTeacherSignature(teacherId: string) {
    if (!confirm('Remove this teacher signature?')) return;
    await apiClient.removeTeacherSignature(teacherId);
    await load();
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-black/60">Manage locks and branding assets used in report PDFs.</p>
      </div>

      <div className="mt-6 rounded-xl border border-black/10 bg-white p-4">
        <h3 className="text-base font-semibold">School Branding</h3>
        <p className="mt-1 text-sm text-black/60">
          Upload and manage school logo, principal signature, and teacher signatures used in report cards.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 text-sm rounded-lg border border-black/10 p-4">
            <div className="font-medium">School Logo</div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative cursor-pointer rounded border border-black/20 px-3 py-1.5 text-xs font-medium hover:bg-black/5">
                Choose File
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <span className="text-xs text-black/60">{logoFile?.name || 'No file chosen'}</span>
            </div>
            {assetUrl(branding?.logoUrl) ? (
              <div className="space-y-2">
                <img src={assetUrl(branding?.logoUrl) ?? ''} alt="School Logo" className="h-20 w-20 rounded border border-black/10 object-contain bg-white p-1" />
                <div className="flex flex-wrap gap-2">
                  <button disabled={uploading} onClick={uploadBranding} className="rounded border border-black/15 px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-50">Replace</button>
                  <button disabled={uploading} onClick={() => removeAsset('logo')} className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50">Remove</button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-black/45">No logo uploaded.</div>
            )}
          </div>

          <div className="space-y-3 text-sm rounded-lg border border-black/10 p-4">
            <div className="font-medium">Principal Signature</div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative cursor-pointer rounded border border-black/20 px-3 py-1.5 text-xs font-medium hover:bg-black/5">
                Choose File
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => setPrincipalSignatureFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <span className="text-xs text-black/60">{principalSignatureFile?.name || 'No file chosen'}</span>
            </div>
            {assetUrl(branding?.principalSignatureUrl) ? (
              <div className="space-y-2">
                <img src={assetUrl(branding?.principalSignatureUrl) ?? ''} alt="Principal Signature" className="h-16 w-40 rounded border border-black/10 object-contain bg-white p-1" />
                <div className="flex flex-wrap gap-2">
                  <button disabled={uploading} onClick={uploadBranding} className="rounded border border-black/15 px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-50">Replace</button>
                  <button disabled={uploading} onClick={() => removeAsset('principalSignature')} className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50">Remove</button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-black/45">No principal signature uploaded.</div>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            disabled={uploading}
            onClick={uploadBranding}
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {uploading ? 'Uploading...' : 'Upload Selected Assets'}
          </button>
          <span className="text-xs text-black/50">Accepted formats: PNG, JPG, WEBP. Max size: 2MB each. (Logo + Principal)</span>
        </div>

        <div className="mt-6 rounded-lg border border-black/10 p-3">
          <h4 className="text-sm font-semibold">Teacher Signatures</h4>
          <p className="mt-1 text-xs text-black/55">Upload signatures per teacher using teacher name/id.</p>

          <div className="mt-3 grid gap-3 md:grid-cols-[1.4fr_1fr_auto] md:items-end">
            <label className="space-y-1 text-sm">
              <div className="font-medium">Teacher</div>
              <select className="w-full rounded-md border border-black/15 px-3 py-2" value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}>
                <option value="">Select teacher</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>{t.name} ({t._id})</option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <div className="font-medium">Signature File</div>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setTeacherSignatureFile(e.target.files?.[0] ?? null)} />
            </label>

            <button
              disabled={teacherUploading}
              onClick={uploadTeacherSignature}
              className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {teacherUploading ? 'Uploading...' : 'Upload/Replace'}
            </button>
          </div>

          <div className="mt-4 overflow-x-auto rounded-md border border-black/10">
            <table className="min-w-[640px] w-full text-sm">
              <thead className="bg-black/5 text-left">
                <tr>
                  <th className="px-3 py-2">Teacher</th>
                  <th className="px-3 py-2">Teacher ID</th>
                  <th className="px-3 py-2">Signature</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(branding?.teacherSignatures ?? []).map((sig: any) => (
                  <tr key={sig.teacherId} className="border-t border-black/5">
                    <td className="px-3 py-2">{sig.teacherName}</td>
                    <td className="px-3 py-2 text-xs text-black/60">{sig.teacherId}</td>
                    <td className="px-3 py-2">
                      {assetUrl(sig.signatureUrl) ? (
                        <img src={assetUrl(sig.signatureUrl) ?? ''} alt={`${sig.teacherName} signature`} className="h-12 w-32 rounded border border-black/10 object-contain bg-white p-1" />
                      ) : (
                        <span className="text-black/45">Not found</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => removeTeacherSignature(sig.teacherId)} className="rounded border border-red-200 px-2 py-1 text-xs text-red-600">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {!(branding?.teacherSignatures ?? []).length ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-black/50" colSpan={4}>No teacher signatures uploaded.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 rounded-lg border border-black/10 bg-white p-4 md:grid-cols-4">
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

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <button disabled={busy} onClick={() => toggleLock(true)} className="rounded-md bg-orange-500 px-4 py-2 text-white disabled:opacity-60">
            Lock
          </button>
          <button disabled={busy} onClick={() => toggleLock(false)} className="rounded-md border border-black/15 px-4 py-2 disabled:opacity-60">
            Unlock
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="min-w-[720px] w-full text-sm">
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
                    <button onClick={() => toggleRowLock(lock)} className="text-orange-600">
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
