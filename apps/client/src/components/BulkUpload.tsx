import { useRef, useState } from 'react';
import { apiClient } from '../lib/clientApi';

export function BulkUpload({ onClose }: { onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any | null>(null);

  async function submit() {
    const f = fileRef.current?.files?.[0];
    if (!f) return alert('Select a file');
    setLoading(true);
    try {
      const res = await apiClient.bulkUploadStudents(f);
      setReport(res);
    } catch (err: unknown) {
      alert((err as Error)?.message ?? 'Upload failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-md p-6 w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-2">Bulk Upload Students (Excel)</h3>
        <div className="space-y-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
            <span>Excel File</span>
            <input ref={fileRef} type="file" accept=".xls,.xlsx" className="text-sm" />
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-1 border rounded">Close</button>
            <button onClick={submit} disabled={loading} className="px-3 py-1 bg-orange-500 text-white rounded">{loading ? 'Uploading…' : 'Upload'}</button>
          </div>
        </div>

        {report && (
          <div className="mt-4 border p-3">
            <div>Total: {report.data?.total}</div>
            <div>Succeeded: {report.data?.succeeded}</div>
            <div>Failed: {report.data?.failed}</div>
            {report.errors?.length > 0 && (
              <div className="mt-2">
                <div className="font-semibold">Errors</div>
                <ul className="list-disc pl-6 text-sm">
                  {report.errors.map((e: any, i: number) => <li key={i}>Row {e.row} ({e.regNo}): {e.reason}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BulkUpload;
