import { useCallback, useRef, useState } from 'react';
import { apiClient } from '../lib/clientApi';

export function BulkUpload({ onClose }: { onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parseErrors, setParseErrors] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<any | null>(null);

  const downloadTemplate = useCallback(() => {
    const headers = ['regNo', 'name', 'fatherName', 'motherName', 'dob', 'class', 'rollNo'];
    const csv = [headers.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students-template.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  async function handleFile(file: File | null) {
    if (!file) return;
    setParsing(true);
    setParsedRows([]);
    setParseErrors([]);
    setSelected({});
    setCommitResult(null);

    try {
      const res = await apiClient.parseBulkStudents(file);
      const parsed = res.data?.parsed ?? [];
      const errors = res.data?.errors ?? [];
      setParsedRows(parsed);
      setParseErrors(errors);
      // default select valid rows
      const sel: Record<number, boolean> = {};
      parsed.forEach((r: any, idx: number) => { if (r.__valid) sel[idx] = true; });
      setSelected(sel);
    } catch (err: unknown) {
      alert((err as Error)?.message ?? 'Parse failed');
    } finally { setParsing(false); }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function onSelectAll(checked: boolean) {
    const newSel: Record<number, boolean> = {};
    parsedRows.forEach((r, i) => { if (r.__valid) newSel[i] = checked; });
    setSelected(newSel);
  }

  async function commitSelected() {
    const rowsToCommit = Object.keys(selected).filter(k => selected[Number(k)]).map(k => parsedRows[Number(k)]);
    if (rowsToCommit.length === 0) return alert('No rows selected');
    setCommitting(true);
    try {
      const res = await apiClient.commitBulkStudents(rowsToCommit);
      setCommitResult(res);
    } catch (err: unknown) {
      alert((err as Error)?.message ?? 'Commit failed');
    } finally { setCommitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-6">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold mb-2">Bulk Upload Students</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={downloadTemplate} className="px-3 py-1 border rounded text-sm">Download Template</button>
            <button onClick={onClose} className="px-3 py-1 border rounded text-sm">Close</button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop} className="p-4 border-dashed border-2 border-gray-300 rounded">
            <div className="text-sm text-black/70 mb-2">Drag & drop CSV/Excel file here</div>
            <div className="text-sm">or</div>
            <div className="mt-2">
              <input ref={fileRef} type="file" accept=".csv,.xls,.xlsx" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
            </div>
            {parsing && <div className="mt-2 text-sm">Parsing…</div>}
            {parseErrors?.length > 0 && (
              <div className="mt-3 text-sm text-red-600">{parseErrors.length} parsing issues (see preview)</div>
            )}
          </div>

          <div className="p-4 border rounded">
            <div className="flex items-center justify-between">
              <div className="font-medium">Preview</div>
              <div>
                <label className="mr-2 text-sm">Select All</label>
                <input type="checkbox" onChange={(e) => onSelectAll(e.target.checked)} />
              </div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="min-w-[520px] w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-black/60">
                    <th className="p-1">#</th>
                    <th className="p-1">Sel</th>
                    <th className="p-1">Reg No</th>
                    <th className="p-1">Name</th>
                    <th className="p-1">Class</th>
                    <th className="p-1">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((r, i) => (
                    <tr key={i} className={`border-t ${!r.__valid ? 'bg-red-50' : ''}`}>
                      <td className="p-1">{r.__row}</td>
                      <td className="p-1">
                        <input type="checkbox" checked={!!selected[i]} disabled={!r.__valid} onChange={(e) => setSelected(s => ({ ...s, [i]: e.target.checked }))} />
                      </td>
                      <td className="p-1">{r.regNo}</td>
                      <td className="p-1">{r.name}</td>
                      <td className="p-1">{r.class}</td>
                      <td className="p-1 text-xs text-red-700">{r.__valid ? '' : parseErrors.find(pe => pe.row === r.__row)?.reason ?? 'Invalid'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button onClick={() => { setParsedRows([]); setSelected({}); setParseErrors([]); }} className="px-3 py-1 border rounded text-sm">Clear</button>
              <button onClick={commitSelected} disabled={committing} className="px-3 py-1 bg-orange-500 text-white rounded text-sm">{committing ? 'Importing…' : 'Import Selected'}</button>
            </div>

            {commitResult && (
              <div className="mt-3 p-2 border text-sm">
                <div>Total: {commitResult.data?.total}</div>
                <div>Succeeded: {commitResult.data?.succeeded}</div>
                <div>Failed: {commitResult.data?.failed}</div>
                {commitResult.errors?.length > 0 && (
                  <div className="mt-2 text-xs text-red-600">
                    {commitResult.errors.map((e: any, idx: number) => <div key={idx}>Row Index {e.index} ({e.regNo}): {e.reason}</div>)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkUpload;
