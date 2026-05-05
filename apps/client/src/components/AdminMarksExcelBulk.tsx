import { useMemo, useRef, useState } from 'react';
import { apiClient } from '../lib/clientApi';

type ParsedRow = {
  rowNumber: number;
  regNo: string;
  name: string;
  className: string;
  studentId: string;
  hasChanges: boolean;
  changedCells: number;
  marksBySubject: Record<string, unknown>;
};

type ParseError = {
  row: number;
  regNo: string;
  reason: string;
};

type ImportError = {
  row: number;
  regNo: string;
  reason: string;
};

export function AdminMarksExcelBulk(props: {
  classId: string;
  className?: string;
  teacherName?: string;
}) {
  const { classId, className, teacherName = '' } = props;
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [downloading, setDownloading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [importSummary, setImportSummary] = useState<{ total: number; succeeded: number; failed: number } | null>(null);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);

  const selectedRows = useMemo(
    () => Object.keys(selected).filter((k) => selected[Number(k)]).map((k) => parsedRows[Number(k)]).filter(Boolean),
    [selected, parsedRows]
  );

  async function handleDownloadTemplate() {
    setDownloading(true);
    try {
      const blob = await apiClient.downloadMarksExcelTemplate(classId || undefined);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = classId ? `${className || 'class'}-marks-template.xlsx` : 'all-classes-marks-template.xlsx';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.message ?? 'Failed to download template');
    } finally {
      setDownloading(false);
    }
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    if (!classId) {
      alert('Select class first.');
      return;
    }

    setParsing(true);
    setParsedRows([]);
    setParseErrors([]);
    setSelected({});
    setImportSummary(null);
    setImportErrors([]);

    try {
      const res = await apiClient.parseMarksExcel(file, classId);
      const rows: ParsedRow[] = res?.data?.parsed ?? [];
      const errors: ParseError[] = res?.data?.errors ?? [];

      setParsedRows(rows);
      setParseErrors(errors);

      // Default select rows with actual mark changes.
      const initialSelected: Record<number, boolean> = {};
      rows.forEach((row, idx) => {
        if (row.hasChanges) initialSelected[idx] = true;
      });
      setSelected(initialSelected);
    } catch (err: any) {
      alert(err?.message ?? 'Failed to parse uploaded file');
    } finally {
      setParsing(false);
    }
  }

  function setAllSelectable(nextValue: boolean, changedOnly = false) {
    const next: Record<number, boolean> = {};
    parsedRows.forEach((row, idx) => {
      if (!changedOnly || row.hasChanges) {
        next[idx] = nextValue;
      }
    });
    setSelected(next);
  }

  async function handleImportSelected() {
    if (!classId) {
      alert('Select class first.');
      return;
    }

    // Use linked teacher passed from parent; if missing, proceed without explicit teacher name.

    if (selectedRows.length === 0) {
      alert('No rows selected.');
      return;
    }

    setImporting(true);
    setImportSummary(null);
    setImportErrors([]);

    try {
      const res = await apiClient.importMarksExcel({
        classId,
        teacherName: teacherName.trim(),
        rows: selectedRows,
      });

      setImportSummary(res?.data ?? null);
      setImportErrors(res?.errors ?? []);
    } catch (err: any) {
      alert(err?.message ?? 'Failed to import selected rows');
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-black/10 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">Admin Excel Bulk Marks Update</h3>
          <p className="text-sm text-black/60">
            Download the pre-filled template, edit marks in Excel, upload, review, select rows, and import.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadTemplate}
            disabled={downloading}
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-60"
          >
            {downloading ? 'Downloading…' : 'Download Filled Template'}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={parsing || !classId}
            className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
          >
            {parsing ? 'Parsing…' : 'Upload Edited Excel'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      {(parsedRows.length > 0 || parseErrors.length > 0) && (
        <div className="mt-4 rounded-lg border border-black/10">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 bg-black/[0.02] px-3 py-2 text-sm">
            <div className="font-medium">
              Parsed rows: {parsedRows.length} | Parsing issues: {parseErrors.length}
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setAllSelectable(true)} className="rounded border px-2 py-1 text-xs">Select all</button>
              <button onClick={() => setAllSelectable(true, true)} className="rounded border px-2 py-1 text-xs">Select changed</button>
              <button onClick={() => setSelected({})} className="rounded border px-2 py-1 text-xs">Clear selection</button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-auto">
            <table className="min-w-[760px] w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-xs text-black/60">
                  <th className="p-2">Sel</th>
                  <th className="p-2">Excel Row</th>
                  <th className="p-2">Reg No</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Changed Cells</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, idx) => (
                  <tr key={`${row.rowNumber}-${row.regNo}`} className="border-t border-black/5">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={Boolean(selected[idx])}
                        onChange={(e) => setSelected((prev) => ({ ...prev, [idx]: e.target.checked }))}
                      />
                    </td>
                    <td className="p-2">{row.rowNumber}</td>
                    <td className="p-2">{row.regNo}</td>
                    <td className="p-2">{row.name}</td>
                    <td className="p-2">{row.changedCells}</td>
                    <td className="p-2">
                      {row.hasChanges ? (
                        <span className="text-emerald-700">Ready</span>
                      ) : (
                        <span className="text-black/50">No changes detected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {parseErrors.length > 0 && (
            <div className="border-t border-black/10 px-3 py-2 text-xs text-red-700">
              {parseErrors.map((error, idx) => (
                <div key={`${error.row}-${idx}`}>Row {error.row} ({error.regNo || 'N/A'}): {error.reason}</div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-black/10 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-black/60">Selected rows: {selectedRows.length}</div>
            <button
              onClick={handleImportSelected}
              disabled={importing || selectedRows.length === 0}
              className="rounded-md bg-orange-500 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {importing ? 'Importing…' : 'Import Selected Rows'}
            </button>
          </div>
        </div>
      )}

      {importSummary && (
        <div className="mt-4 rounded-lg border border-black/10 p-3 text-sm">
          <div className="font-medium mb-1">Import summary</div>
          <div>Total selected: {importSummary.total}</div>
          <div>Succeeded: {importSummary.succeeded}</div>
          <div>Failed: {importSummary.failed}</div>
          {importErrors.length > 0 && (
            <div className="mt-2 text-xs text-red-700">
              {importErrors.map((error, idx) => (
                <div key={`${error.row}-${idx}`}>Row {error.row} ({error.regNo || 'N/A'}): {error.reason}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default AdminMarksExcelBulk;
