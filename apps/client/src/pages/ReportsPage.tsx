import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../lib/clientApi';
import { useDebounce } from '../lib/utils';
import toast from 'react-hot-toast';

export function ReportsPage() {
  // ── Filter / search state ──────────────────────────────────────────────
  const [classFilter, setClassFilter] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');   // committed search term (from suggestion or debounce)

  // Typeahead suggestions
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggLoading, setSuggLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // ── Student list state ─────────────────────────────────────────────────
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);

  // ── Selection state ────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectAllLoading, setSelectAllLoading] = useState(false);

  // ── Preview state ──────────────────────────────────────────────────────
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // ── Bulk download state ────────────────────────────────────────────────
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState('');

  const previewUrlRef = useRef<string | null>(null);

  // ── Debounced values ───────────────────────────────────────────────────
  const debouncedSearch = useDebounce(appliedSearch, 350);
  const debouncedSuggInput = useDebounce(searchInput, 250);

  // ── Load classes once ──────────────────────────────────────────────────
  useEffect(() => {
    apiClient.getClasses().then((r) => setClasses(r.data ?? r));
  }, []);

  // ── Fetch students whenever class or committed search changes ──────────
  useEffect(() => {
    setPage(1);
    fetchStudents(1, debouncedSearch, classFilter);
  }, [debouncedSearch, classFilter]);

  // ── Re-fetch when page changes (pagination) ────────────────────────────
  useEffect(() => {
    fetchStudents(page, debouncedSearch, classFilter);
  }, [page]);

  // ── Typeahead: fetch suggestions as user types ─────────────────────────
  useEffect(() => {
    if (!debouncedSuggInput || debouncedSuggInput.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    let active = true;
    setSuggLoading(true);
    apiClient
      .getStudents({
        page: 1,
        limit: 8,
        search: debouncedSuggInput,
        ...(classFilter ? { classId: classFilter } : {}),
      })
      .then((res) => {
        if (!active) return;
        setSuggestions(res.data ?? []);
        setHighlightedIndex(-1);
        setShowSuggestions(true);
      })
      .finally(() => { if (active) setSuggLoading(false); });
    return () => { active = false; };
  }, [debouncedSuggInput, classFilter]);

  // ── Close suggestions on outside click ────────────────────────────────
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  // ── Core fetch function ────────────────────────────────────────────────
  async function fetchStudents(pageToLoad: number, searchTerm: string, classId: string) {
    setLoading(true);
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

  // ── Class change — instant, resets page ───────────────────────────────
  function handleClassChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setClassFilter(e.target.value);
    setSelected(new Set());
    setPage(1);
  }

  // ── Pick a suggestion → commit it as the active search filter ─────────
  function pickSuggestion(student: any) {
    setSearchInput(student.name);
    setAppliedSearch(student.name);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    // ADD to existing selection — don't replace it
    setSelected((prev) => new Set([...prev, student._id]));
  }

  // ── Search input typing ────────────────────────────────────────────────
  function handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchInput(val);
    setHighlightedIndex(-1);
    if (!val) {
      setAppliedSearch('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Total items = suggestions + optional "Search for X" row at bottom
    const hasFreeSearch = !!searchInput;
    const totalItems = suggestions.length + (hasFreeSearch ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showSuggestions && suggestions.length > 0) { setShowSuggestions(true); return; }
      const next = highlightedIndex < totalItems - 1 ? highlightedIndex + 1 : 0;
      setHighlightedIndex(next);
      // Scroll into view — suggestions refs; last item is free-search row
      if (next < suggestions.length) {
        suggestionRefs.current[next]?.scrollIntoView({ block: 'nearest' });
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!showSuggestions) return;
      const prev = highlightedIndex > 0 ? highlightedIndex - 1 : totalItems - 1;
      setHighlightedIndex(prev);
      if (prev < suggestions.length) {
        suggestionRefs.current[prev]?.scrollIntoView({ block: 'nearest' });
      }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        // Pick highlighted suggestion
        pickSuggestion(suggestions[highlightedIndex]);
      } else {
        // Commit raw typed text
        setAppliedSearch(searchInput);
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
      return;
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  }

  function clearSearch() {
    setSearchInput('');
    setAppliedSearch('');
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  }

  // ── Selection helpers ──────────────────────────────────────────────────
  const allSelected = total > 0 && selected.size === total;
  const someSelected = selected.size > 0 && !allSelected;

  async function toggleSelectAll() {
    if (allSelected) { setSelected(new Set()); return; }
    setSelectAllLoading(true);
    try {
      const res = await apiClient.getStudentIds({ search: appliedSearch, classId: classFilter || undefined });
      setSelected(new Set(res.data ?? []));
    } finally {
      setSelectAllLoading(false);
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
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
      toast.error(err?.message ?? 'Failed to generate preview');
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
      toast.error(err?.message ?? 'Failed to download');
    }
  }

  // ── Bulk download ──────────────────────────────────────────────────────
  async function bulkDownload(type: 'zip' | 'pdf') {
    const ids = Array.from(selected);
    if (!ids.length) return;
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
      toast.success(`Downloaded ${ids.length} report${ids.length > 1 ? 's' : ''} successfully`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Bulk download failed');
    } finally {
      setBulkLoading(false);
      setBulkProgress('');
    }
  }

  const selectedCount = selected.size;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="p-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Reports</h2>
          <p className="text-sm text-black/60">
            Filter by class or search students — results update in real time.
          </p>
        </div>

        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-sm font-medium">
              {selectedCount} selected
            </span>
            <button
              id="bulk-download-zip-btn"
              onClick={() => bulkDownload('zip')}
              disabled={bulkLoading}
              className="rounded-md bg-orange-500 text-white px-4 py-2 text-sm font-medium hover:bg-orange-600 disabled:opacity-60 transition-colors flex items-center gap-1.5"
            >
              {bulkLoading ? <><SpinnerIcon />{bulkProgress || 'Generating…'}</> : <><DownloadZipIcon />Download ZIP</>}
            </button>
            <button
              id="bulk-download-pdf-btn"
              onClick={() => bulkDownload('pdf')}
              disabled={bulkLoading}
              className="rounded-md border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black/5 disabled:opacity-50 transition-colors"
            >
              {bulkLoading ? 'Generating…' : 'Download PDF'}
            </button>
          </div>
        )}
      </div>

      {/* ── Filters bar ── */}
      <div className="mt-5 flex flex-wrap gap-3 items-end">

        {/* Class dropdown — real-time */}
        <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
          <span>Class</span>
          <select
            id="report-class-filter"
            value={classFilter}
            onChange={handleClassChange}
            className="rounded-md border border-black/15 px-3 py-2 bg-white min-w-40"
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </label>

        {/* Search with typeahead dropdown */}
        <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
          <span className="flex items-center gap-1.5">
            Search
            {suggLoading && <SpinnerIcon className="text-black/30" />}
          </span>
          <div className="relative" ref={searchBoxRef}>
            <div className="relative flex items-center">
              <input
                id="report-search-input"
                value={searchInput}
                onChange={handleSearchInput}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Name or Reg No…"
                autoComplete="off"
                role="combobox"
                aria-expanded={showSuggestions}
                aria-haspopup="listbox"
                aria-controls="report-suggestion-list"
                aria-activedescendant={
                  showSuggestions && highlightedIndex >= 0 && highlightedIndex < suggestions.length
                    ? `report-suggestion-${highlightedIndex}`
                    : undefined
                }
                aria-autocomplete="list"
                className="rounded-md border border-black/15 px-3 py-2 pr-8 min-w-64 font-normal"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2.5 text-black/30 hover:text-black/60 text-lg leading-none"
                  tabIndex={-1}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {/* Suggestion dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                id="report-suggestion-list"
                role="listbox"
                aria-label="Student suggestions"
                className="absolute z-50 mt-1 w-full min-w-[280px] rounded-xl border border-black/10 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.13)] overflow-hidden max-h-72 overflow-y-auto"
              >
                <div className="px-3 py-1.5 text-xs text-black/40 border-b border-black/5 bg-black/[0.02] font-medium tracking-wide sticky top-0">
                  {suggestions.length} match{suggestions.length > 1 ? 'es' : ''} — ↑↓ to navigate, ↵ to select
                </div>
                {suggestions.map((s, idx) => {
                  const isHighlighted = highlightedIndex === idx;
                  return (
                    <button
                      key={s._id}
                      id={`report-suggestion-${idx}`}
                      ref={(el) => { suggestionRefs.current[idx] = el; }}
                      role="option"
                      aria-selected={isHighlighted}
                      type="button"
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onMouseDown={(e) => { e.preventDefault(); pickSuggestion(s); }}
                      className={[
                        'w-full text-left flex items-center gap-3 px-3 py-2.5 transition-colors group border-b border-black/[0.04] last:border-0',
                        isHighlighted ? 'bg-orange-50' : 'hover:bg-orange-50',
                      ].join(' ')}
                    >
                      <div className={[
                        'flex-shrink-0 w-8 h-8 rounded-full font-bold text-sm flex items-center justify-center transition-colors',
                        isHighlighted ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700',
                      ].join(' ')}>
                        {s.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <div className={['font-medium text-sm truncate transition-colors', isHighlighted ? 'text-orange-700' : 'text-black'].join(' ')}>
                          {s.name}
                        </div>
                        <div className="text-xs text-black/50 font-mono">{s.regNo} · {s.classId?.name ?? '—'}</div>
                      </div>
                      <div className={['ml-auto text-xs shrink-0 transition-colors', isHighlighted ? 'text-orange-400' : 'text-black/20'].join(' ')}>↵</div>
                    </button>
                  );
                })}
                {searchInput && (
                  <button
                    type="button"
                    role="option"
                    aria-selected={highlightedIndex === suggestions.length}
                    id={`report-suggestion-${suggestions.length}`}
                    onMouseEnter={() => setHighlightedIndex(suggestions.length)}
                    onMouseDown={(e) => { e.preventDefault(); setAppliedSearch(searchInput); setShowSuggestions(false); setHighlightedIndex(-1); }}
                    className={[
                      'w-full text-left px-3 py-2 text-sm transition-colors border-t border-black/5 flex items-center gap-2',
                      highlightedIndex === suggestions.length ? 'bg-black/[0.05] text-black/70' : 'text-black/50 hover:bg-black/[0.03]',
                    ].join(' ')}
                  >
                    <span className="text-xs bg-black/5 rounded px-1.5 py-0.5 font-mono">↵</span>
                    Search for "<strong className="text-black/70">{searchInput}</strong>" across all results
                  </button>
                )}
              </div>
            )}
          </div>
        </label>

        {/* Active filter chips */}
        {(appliedSearch || classFilter) && (
          <div className="flex items-center gap-2 pb-0.5">
            {appliedSearch && (
              <span className="flex items-center gap-1 rounded-full bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-1">
                "{appliedSearch}"
                <button onClick={clearSearch} className="ml-0.5 text-orange-500 hover:text-orange-700">×</button>
              </span>
            )}
            {classFilter && (
              <span className="flex items-center gap-1 rounded-full bg-black/[0.07] text-black/70 text-xs font-medium px-2.5 py-1">
                {classes.find((c) => c._id === classFilter)?.name ?? 'Class'}
                <button onClick={() => { setClassFilter(''); setSelected(new Set()); }} className="ml-0.5 text-black/40 hover:text-black/70">×</button>
              </span>
            )}
          </div>
        )}

        {students.length > 0 && (
          <button
            id="report-select-all-btn"
            onClick={toggleSelectAll}
            disabled={selectAllLoading}
            className="rounded-md border border-black/15 px-4 py-2 text-sm hover:bg-black/5 transition-colors disabled:opacity-50 self-end"
          >
            {selectAllLoading ? 'Selecting…' : allSelected ? 'Deselect All' : `Select All (${total})`}
          </button>
        )}
      </div>

      {/* ── Main grid ── */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">

        {/* Student table */}
        <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-black/5 text-left">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    id="report-select-all-checkbox"
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
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
              {/* Skeleton while loading */}
              {loading && students.length === 0 && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t border-black/5">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="animate-pulse h-4 rounded bg-black/[0.06]" />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Loading overlay rows (when paginating / re-filtering) */}
              {loading && students.length > 0 && students.map((student) => (
                <tr key={student._id} className="border-t border-black/5 opacity-40">
                  <td className="px-4 py-3"><div className="animate-pulse h-4 w-4 rounded bg-black/10" /></td>
                  <td className="px-4 py-3"><div className="animate-pulse h-4 rounded bg-black/[0.06]" /></td>
                  <td className="px-4 py-3"><div className="animate-pulse h-4 rounded bg-black/[0.06]" /></td>
                  <td className="px-4 py-3"><div className="animate-pulse h-4 rounded bg-black/[0.06]" /></td>
                  <td className="px-4 py-3"><div className="animate-pulse h-4 rounded bg-black/[0.06]" /></td>
                </tr>
              ))}

              {/* Student rows */}
              {!loading && students.map((student) => {
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
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
              {!loading && students.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-black/40 text-sm">
                    {appliedSearch || classFilter
                      ? 'No students found for these filters.'
                      : 'All students are shown here. Use the Class filter or search to narrow down.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-black/10 px-4 py-3 text-sm text-black/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span>Showing {students.length} of {total} student{total !== 1 ? 's' : ''}</span>
              {loading && <SpinnerIcon className="text-black/30" />}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!canGoPrev || loading}
                className="rounded-md border border-black/10 px-3 py-1 text-sm disabled:opacity-50 hover:bg-black/5"
              >
                Prev
              </button>
              <span className="px-3 py-1">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={!canGoNext || loading}
                className="rounded-md border border-black/10 px-3 py-1 text-sm disabled:opacity-50 hover:bg-black/5"
              >
                Next
              </button>
            </div>
          </div>

          {/* Selection summary bar */}
          {selectedCount > 0 && (
            <div className="flex flex-col gap-2 border-t border-black/10 bg-orange-50 px-4 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-orange-700 font-medium">
                {selectedCount} of {total} student{total !== 1 ? 's' : ''} selected
              </span>
              <button onClick={() => setSelected(new Set())} className="text-black/50 hover:text-black/80">
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Preview panel */}
        <div className="rounded-lg border border-black/10 p-4 min-h-[50vh] lg:min-h-[70vh] flex flex-col bg-white">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold text-sm">Preview</h3>
            {previewName && (
              <span className="text-xs text-black/50 bg-black/5 rounded px-2 py-1">{previewName}</span>
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

// ── Icon components ────────────────────────────────────────────────────────────

function SpinnerIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin h-4 w-4 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function DownloadZipIcon() {
  return (
    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

function PreviewIcon() {
  return (
    <svg className="h-8 w-8 text-black/20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6M6 2h8l4 4v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" />
    </svg>
  );
}

export default ReportsPage;
