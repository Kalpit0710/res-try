import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../lib/clientApi';

export function ReportsPage() {
  // ── Search / filter state ──────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);

  // ── Selection state ────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── Preview state ──────────────────────────────────────────────────────
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // ── Bulk download state ────────────────────────────────────────────────
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState('');
  const [selectAllLoading, setSelectAllLoading] = useState(false);

  // Ref for cleanup
  const previewUrlRef = useRef<string | null>(null);

  // Load classes for filter dropdown
  useEffect(() => {
    apiClient.getClasses().then((r) => setClasses(r.data ?? r));
  }, []);

  async function loadStudents(pageToLoad: number, searchTerm: string, classId: string) {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await apiClient.getStudents({
        page: pageToLoad,
        limit,
        search: searchTerm,
        ...(classId ? { classId } : {}),
      });
      setStudents(res.data ?? []);
      setTotal(res.total ?? 0);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    setSelected(new Set());
    if (page === 1) {
      loadStudents(1, search, classFilter);
    } else {
      setPage(1);
    }
  }

  useEffect(() => {
    loadStudents(page, search, classFilter);
  }, [page]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
  }

  // ── Selection helpers ──────────────────────────────────────────────────
  const allIds = students.map((s) => s._id);
  const allSelected = total > 0 && selected.size === total;
  const someSelected = selected.size > 0 && !allSelected;

  async function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
      return;
    }

    if (selected.size === total && total > 0) {
      setSelected(new Set(allIds));
      return;
    }

    setSelectAllLoading(true);
    try {
      const res = await apiClient.getStudents({
        page: 1,
        limit: total || 1,
        search,
        ...(classFilter ? { classId: classFilter } : {}),
      });
      const ids = (res.data ?? []).map((student: any) => student._id);
      setSelected(new Set(ids));
    } finally {
      setSelectAllLoading(false);
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── Preview ────────────────────────────────────────────────────────────
  async function openPreview(studentId: string, name: string) {
    setPreviewLoading(true);
    try {
      const blob = await apiClient.getStudentReportPdf(studentId);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
      setPreviewName(name);
    } catch (err: any) {
      alert(err?.message ?? 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function downloadSingle(studentId: string, name: string, regNo: string) {
    try {
      const blob = await apiClient.getStudentReportPdf(studentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}_${regNo}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      alert(err?.message ?? 'Failed to download');
    }
  }

  // ── Bulk download ──────────────────────────────────────────────────────
  async function bulkDownload(type: 'zip' | 'pdf') {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    setBulkLoading(true);
    setBulkProgress(`Generating ${ids.length} report${ids.length > 1 ? 's' : ''}…`);
    try {
      const blob = type === 'pdf'
        ? await apiClient.bulkDownloadReportsPdf(ids)
        : await apiClient.bulkDownloadReports(ids);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'pdf'
        ? `combined-report-cards-${new Date().toISOString().slice(0, 10)}.pdf`
        : `report-cards-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setBulkProgress('');
    } catch (err: any) {
      alert(err?.message ?? 'Bulk download failed');
      setBulkProgress('');
    } finally {
      setBulkLoading(false);
    }
  }

  const selectedCount = selected.size;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="p-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Reports</h2>
          <p className="text-sm text-black/60">
            Search, select students and preview or bulk-download PDF report cards.
          </p>
        </div>

        {/* Bulk Download button — shown when ≥1 selected */}
        <div className="flex items-center gap-3">
          {selectedCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-sm font-medium">
                {selectedCount} selected
              </span>
              <button
                id="bulk-download-zip-btn"
                onClick={() => bulkDownload('zip')}
                disabled={bulkLoading}
                className="rounded-md bg-orange-500 text-white px-4 py-2 text-sm font-medium hover:bg-orange-600 disabled:opacity-60 transition-colors"
              >
                {bulkLoading ? (
                  <>
                    <SpinnerIcon />
                    {bulkProgress || 'Generating…'}
                  </>
                ) : (
                  <>
                    <DownloadZipIcon />
                    Download ZIP
                  </>
                )}
              </button>
              <button
                id="bulk-download-pdf-btn"
                onClick={() => bulkDownload('pdf')}
                disabled={bulkLoading}
                className="rounded-md border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black hover:border-black/25 hover:bg-black/5 disabled:opacity-50 transition-colors"
              >
                {bulkLoading ? 'Generating…' : 'Download PDF'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Search bar ──────────────────────────────────────────────────── */}
      <div className="mt-5 flex flex-wrap gap-2 items-end">
        <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
          <span>Class</span>
          <select
            id="report-class-filter"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2 bg-white min-w-40"
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
          <span>Search</span>
          <input
            id="report-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Name or Reg No"
            className="rounded-md border border-black/15 px-3 py-2 min-w-56 font-normal"
          />
        </label>

        <button
          id="report-search-btn"
          onClick={handleSearch}
          disabled={loading}
          className="rounded-md bg-orange-500 text-white px-4 py-2 text-sm hover:bg-orange-600 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>

        {students.length > 0 && (
          <button
            id="report-select-all-btn"
            onClick={toggleSelectAll}
            disabled={selectAllLoading}
            className="rounded-md border border-black/15 px-4 py-2 text-sm hover:bg-black/5 transition-colors disabled:opacity-50"
          >
            {selectAllLoading ? 'Selecting…' : allSelected ? 'Deselect All' : `Select All (${total})`}
          </button>
        )}
      </div>

      {/* ── Main grid: table + preview ──────────────────────────────────── */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">

        {/* Student table */}
        <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-black/5 text-left">
              <tr>
                {/* Select-all checkbox */}
                <th className="px-4 py-3 w-10">
                  <input
                    id="report-select-all-checkbox"
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded accent-orange-500 cursor-pointer"
                    aria-label="Select all students"
                  />
                </th>
                <th className="px-4 py-3">Reg No</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const isSelected = selected.has(student._id);
                return (
                  <tr
                    key={student._id}
                    onClick={() => toggleOne(student._id)}
                    className={[
                      'border-t border-black/5 cursor-pointer transition-colors',
                      isSelected ? 'bg-orange-50' : 'hover:bg-black/[0.02]',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(student._id)}
                        className="h-4 w-4 rounded accent-orange-500 cursor-pointer"
                        aria-label={`Select ${student.name}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-black/70">{student.regNo}</td>
                    <td className="px-4 py-3 font-medium">{student.name}</td>
                    <td className="px-4 py-3 text-black/60">{student.classId?.name ?? '-'}</td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-3">
                        <button
                          onClick={() => openPreview(student._id, student.name)}
                          disabled={previewLoading}
                          className="text-orange-600 hover:text-orange-700 disabled:opacity-50 text-xs font-medium"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => downloadSingle(student._id, student.name, student.regNo)}
                          className="text-black/50 hover:text-black/80 text-xs font-medium"
                        >
                          ↓ PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Empty state */}
              {hasSearched && !loading && students.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-black/40 text-sm"
                  >
                    No students found. Try a different search or class filter.
                  </td>
                </tr>
              )}
              {!hasSearched && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-black/40 text-sm">
                    Loading students…
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-4 flex flex-col gap-3 border-t border-black/10 px-4 py-3 text-sm text-black/60 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Showing {students.length} of {total} students
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={!canGoPrev || loading}
                className="rounded-md border border-black/10 px-3 py-1 text-sm disabled:opacity-50"
              >
                Prev
              </button>
              <span className="px-3 py-1">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={!canGoNext || loading}
                className="rounded-md border border-black/10 px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {/* Selection summary bar */}
          {selectedCount > 0 && (
            <div className="flex flex-col gap-2 border-t border-black/10 bg-orange-50 px-4 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-orange-700 font-medium">
                {selectedCount} of {total} filtered student{total === 1 ? '' : 's'} selected
              </span>
              <div className="flex flex-wrap gap-3 items-center">
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-black/50 hover:text-black/80"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview panel */}
        <div className="rounded-lg border border-black/10 p-4 min-h-[50vh] lg:min-h-[70vh] flex flex-col bg-white">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold text-sm">Preview</h3>
            {previewName && (
              <span className="text-xs text-black/50 bg-black/5 rounded px-2 py-1">
                {previewName}
              </span>
            )}
          </div>

          {previewLoading && (
            <div className="flex-1 flex items-center justify-center text-sm text-black/50">
              <SpinnerIcon className="mr-2" /> Generating PDF…
            </div>
          )}

          {!previewLoading && previewUrl && (
            <iframe
              title="Report Preview"
              src={previewUrl}
              className="mt-4 flex-1 w-full rounded border border-black/10 min-h-[60vh]"
            />
          )}

          {!previewLoading && !previewUrl && (
            <div className="flex-1 mt-4 rounded border border-dashed border-black/15 flex flex-col items-center justify-center text-sm text-black/40 gap-2">
              <PreviewIcon />
              <span>Click <strong>Preview</strong> on a student to see their report card here.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Small icon components ──────────────────────────────────────────────────

function SpinnerIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin h-4 w-4 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function DownloadZipIcon() {
  return (
    <svg
      className="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

function PreviewIcon() {
  return (
    <svg
      className="h-8 w-8 text-black/20"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6M6 2h8l4 4v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" />
    </svg>
  );
}

export default ReportsPage;
