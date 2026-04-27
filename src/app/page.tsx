"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

/* ──────────────────────────────────────────────────────────── Types */

type ClassItem = { id: string; name: string };
type SectionItem = { id: string; name: string; classId: string; classTeacherName: string; class: ClassItem };
type SubjectItem = { id: string; name: string };
type StudentItem = {
  id: string;
  admissionNumber: string;
  name: string;
  dateOfBirth: string | null;
  parentName: string | null;
  contact: string | null;
  classId: string;
  sectionId: string;
  class: ClassItem;
  section: SectionItem;
};
type MarkRow = {
  subjectId: string;
  subjectName: string;
  halfYearlyMarks: number;
  finalTermMarks: number;
  totalMarks: number;
};
type GradeRangeItem = { id?: string; min: number; max: number; grade: string };
type ResultItem = {
  id: string;
  classId: string;
  grandTotal: number;
  maxTotal: number;
  percentage: number;
  grade: string;
  class: ClassItem;
  student: { id: string; admissionNumber: string; name: string; section: { name: string } };
};
type StudentFormState = {
  admissionNumber: string;
  name: string;
  classId: string;
  sectionId: string;
  dateOfBirth: string;
  parentName: string;
  contact: string;
};
type SectionEditState = { classId: string; name: string; classTeacherName: string };
type DeleteImpactResponse = {
  entity: "class" | "section" | "subject" | "student";
  id: string;
  name: string;
  counts: Record<string, string | number>;
};
type ConfirmDialogState = {
  title: string;
  message: string;
  warnings: string[];
  confirmLabel: string;
  onConfirm: () => Promise<void>;
};
type Toast = { id: number; message: string; type: "success" | "error" | "info" | "warning"; exiting?: boolean };
type Tab = "dashboard" | "setup" | "students" | "marks" | "results" | "reports" | "grading";

/* ──────────────────────────────────────────────────────────── API */

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const payload = (await response.json().catch(() => ({}))) as { success?: boolean; data?: T; message?: string };
  if (!response.ok || payload.success === false) throw new Error(payload.message ?? "Request failed");
  return payload.data as T;
}

function toDateInput(v: string | null | undefined) {
  return v ? v.slice(0, 10) : "";
}

/* ──────────────────────────────────────────────────────────── Icons */

function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  setup: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  students: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75 M9 11a4 4 0 100-8 4 4 0 000 8z",
  marks: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  results: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  reports: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z M12 3v6h6",
  grading: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  sun: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z",
  moon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  delete: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  pdf: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
  download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  upload: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
  refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 18L18 6M6 6l12 12",
  check: "M5 13l4 4L19 7",
  warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  plus: "M12 4v16m8-8H4",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  chevronLeft: "M15 19l-7-7 7-7",
  chevronRight: "M9 5l7 7-7 7",
  zip: "M8 17l4 4 4-4m-4-5v9 M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29",
  excel: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z",
};

/* ──────────────────────────────────────────────────────────── Spinner */

function Spinner({ size = 16 }: { size?: number }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden />;
}

/* ──────────────────────────────────────────────────────────── Toasts */

function ToastList({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
        alignItems: "flex-end",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast${t.exiting ? " toast-exit" : ""}`}
          onClick={() => dismiss(t.id)}
          style={{
            background:
              t.type === "success"
                ? "#16a34a"
                : t.type === "error"
                  ? "#dc2626"
                  : t.type === "warning"
                    ? "#d97706"
                    : "#4f46e5",
            color: "#fff",
            pointerEvents: "auto",
          }}
        >
          <Icon
            size={17}
            d={
              t.type === "success"
                ? ICONS.check
                : t.type === "error"
                  ? ICONS.close
                  : t.type === "warning"
                    ? ICONS.warning
                    : ICONS.info
            }
          />
          <span style={{ flex: 1 }}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── Section header */

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>{title}</h2>
      {subtitle && (
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{subtitle}</p>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── Counter */

let _toastCounter = 0;

/* ──────────────────────────────────────────────────────────── Main */

export default function Home() {
  /* Auth */
  const [loggedIn, setLoggedIn] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [email, setEmail] = useState("admin@school.local");
  const [password, setPassword] = useState("admin123");
  const [loginBusy, setLoginBusy] = useState(false);

  /* Data */
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [studentDirectory, setStudentDirectory] = useState<StudentItem[]>([]);
  const [studentDirectoryTotal, setStudentDirectoryTotal] = useState(0);
  const [studentDirectoryPage, setStudentDirectoryPage] = useState(1);
  const [studentDirectoryQuery, setStudentDirectoryQuery] = useState("");
  const [studentDirectorySearchInput, setStudentDirectorySearchInput] = useState("");
  const [studentDirectoryClassId, setStudentDirectoryClassId] = useState("");
  const [dashboard, setDashboard] = useState<Record<string, number>>({});
  const [gradeRanges, setGradeRanges] = useState<GradeRangeItem[]>([]);
  const [selectedResultsClassId, setSelectedResultsClassId] = useState("");
  const [classResults, setClassResults] = useState<ResultItem[]>([]);
  const [rankingSearchInput, setRankingSearchInput] = useState("");
  const [rankingSearch, setRankingSearch] = useState("");
  const [markRows, setMarkRows] = useState<MarkRow[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);

  /* Forms */
  const [newClassName, setNewClassName] = useState("");
  const [newSectionName, setNewSectionName] = useState("A");
  const [sectionClassId, setSectionClassId] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [mapClassId, setMapClassId] = useState("");
  const [mapSubjectId, setMapSubjectId] = useState("");
  const [studentForm, setStudentForm] = useState<StudentFormState>({
    admissionNumber: "",
    name: "",
    classId: "",
    sectionId: "",
    dateOfBirth: "",
    parentName: "",
    contact: "",
  });

  /* Edit states */
  const [editingClassId, setEditingClassId] = useState("");
  const [editingClassName, setEditingClassName] = useState("");
  const [editingSectionId, setEditingSectionId] = useState("");
  const [editingSectionForm, setEditingSectionForm] = useState<SectionEditState | null>(null);
  const [editingSubjectId, setEditingSubjectId] = useState("");
  const [editingSubjectName, setEditingSubjectName] = useState("");
  const [editingStudentId, setEditingStudentId] = useState("");
  const [editStudentForm, setEditStudentForm] = useState<StudentFormState | null>(null);

  /* UI */
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [busyButtons, setBusyButtons] = useState<Set<string>>(new Set());

  const directoryPageSize = 10;
  const directoryTotalPages = Math.max(1, Math.ceil(studentDirectoryTotal / directoryPageSize));

  /* ── Toast helpers ── */
  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = ++_toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 260);
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 260);
  }, []);

  /* ── Busy helpers ── */
  function setBusy(key: string, val: boolean) {
    setBusyButtons((prev) => {
      const next = new Set(prev);
      val ? next.add(key) : next.delete(key);
      return next;
    });
  }
  function isBusy(key: string) {
    return busyButtons.has(key);
  }

  /* ── Theme ── */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "dark") {
        setDarkMode(true);
        document.documentElement.setAttribute("data-theme", "dark");
      }
    } catch {
      // ignore
    }
  }, []);

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  }

  /* ── Data loaders ── */
  const loadAll = useCallback(async () => {
    const [cls, sec, sub, stPay, dash] = await Promise.all([
      api<ClassItem[]>("/api/classes"),
      api<SectionItem[]>("/api/sections"),
      api<SubjectItem[]>("/api/subjects"),
      api<{ students: StudentItem[] }>("/api/students?page=1&pageSize=300"),
      api<Record<string, number>>("/api/dashboard"),
    ]);
    setClasses(cls);
    setSections(sec);
    setSubjects(sub);
    setStudents(stPay.students);
    setDashboard(dash);
    if (cls.length > 0) {
      setSectionClassId((p) => p || cls[0].id);
      setMapClassId((p) => p || cls[0].id);
      setSelectedResultsClassId((p) => p || cls[0].id);
      setStudentForm((p) => (p.classId ? p : { ...p, classId: cls[0].id }));
    }
    if (sub.length > 0) setMapSubjectId((p) => p || sub[0].id);
    return cls[0]?.id;
  }, []);

  const loadGradeRanges = useCallback(async () => {
    const r = await api<GradeRangeItem[]>("/api/grading");
    setGradeRanges(r);
  }, []);

  const loadClassResults = useCallback(
    async (classIdOverride?: string) => {
      const cid = classIdOverride ?? selectedResultsClassId;
      if (!cid) {
        setClassResults([]);
        return;
      }
      const rows = await api<ResultItem[]>(`/api/results?classId=${encodeURIComponent(cid)}`);
      setClassResults(rows);
    },
    [selectedResultsClassId],
  );

  const loadStudentDirectory = useCallback(
    async (overrides?: { page?: number; query?: string; classId?: string }) => {
      const activePage = overrides?.page ?? studentDirectoryPage;
      const activeQuery = overrides?.query ?? studentDirectoryQuery;
      const activeClassId = overrides?.classId ?? studentDirectoryClassId;
      const params = new URLSearchParams({ page: String(activePage), pageSize: String(directoryPageSize) });
      if (activeQuery.trim()) params.set("q", activeQuery.trim());
      if (activeClassId) params.set("classId", activeClassId);
      const payload = await api<{ total: number; students: StudentItem[] }>(`/api/students?${params.toString()}`);
      setStudentDirectory(payload.students);
      setStudentDirectoryTotal(payload.total);
    },
    [studentDirectoryClassId, studentDirectoryPage, studentDirectoryQuery],
  );

  /* ── Boot ── */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await api("/api/auth/me");
        if (!mounted) return;
        setLoggedIn(true);
        setGlobalLoading(true);
        const firstClassId = await loadAll();
        await Promise.all([loadStudentDirectory({ page: 1 }), loadGradeRanges(), loadClassResults(firstClassId)]);
      } catch {
        if (!mounted) return;
        setLoggedIn(false);
      } finally {
        if (mounted) {
          setAuthChecking(false);
          setGlobalLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loadAll, loadClassResults, loadGradeRanges, loadStudentDirectory]);

  /* ── Debounced search ── */
  useEffect(() => {
    const t = setTimeout(() => {
      setStudentDirectoryQuery(studentDirectorySearchInput);
      setStudentDirectoryPage(1);
      if (!loggedIn) return;
      void loadStudentDirectory({ page: 1, query: studentDirectorySearchInput });
    }, 400);
    return () => clearTimeout(t);
  }, [loggedIn, loadStudentDirectory, studentDirectorySearchInput]);

  useEffect(() => {
    const t = setTimeout(() => setRankingSearch(rankingSearchInput), 400);
    return () => clearTimeout(t);
  }, [rankingSearchInput]);

  /* ── Ranked results ── */
  const rankedClassResults = useMemo(
    () =>
      [...classResults]
        .sort(
          (a, b) =>
            b.percentage - a.percentage ||
            b.grandTotal - a.grandTotal ||
            a.student.name.localeCompare(b.student.name),
        )
        .filter((item) => {
          if (!rankingSearch.trim()) return true;
          const q = rankingSearch.trim().toLowerCase();
          return (
            item.student.name.toLowerCase().includes(q) ||
            item.student.admissionNumber.toLowerCase().includes(q) ||
            item.student.section.name.toLowerCase().includes(q)
          );
        })
        .map((item, i) => ({ ...item, rank: i + 1 })),
    [classResults, rankingSearch],
  );

  const sectionOptions = useMemo(
    () => sections.filter((s) => s.classId === studentForm.classId),
    [sections, studentForm.classId],
  );
  const editSectionOptions = useMemo(
    () => sections.filter((s) => s.classId === (editStudentForm?.classId ?? "")),
    [editStudentForm?.classId, sections],
  );

  /* ──────────────────────────────── Handlers */

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginBusy(true);
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      setLoggedIn(true);
      setGlobalLoading(true);
      const firstClassId = await loadAll();
      await Promise.all([loadStudentDirectory({ page: 1 }), loadGradeRanges(), loadClassResults(firstClassId)]);
      addToast("Welcome back! Logged in successfully.", "success");
    } catch (err) {
      addToast(String(err), "error");
    } finally {
      setLoginBusy(false);
      setGlobalLoading(false);
    }
  }

  async function handleInitialize() {
    setBusy("init", true);
    try {
      await api("/api/setup/seed", { method: "POST", body: JSON.stringify({}) });
      addToast("System initialised with default admin and grade ranges.", "success");
    } catch (err) {
      addToast(String(err), "error");
    } finally {
      setBusy("init", false);
    }
  }

  async function handleLogout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      setLoggedIn(false);
      addToast("Logged out successfully.", "info");
    }
  }

  async function handleCreateClass(e: FormEvent) {
    e.preventDefault();
    if (!newClassName.trim()) {
      addToast("Class name is required.", "warning");
      return;
    }
    setBusy("createClass", true);
    try {
      await api("/api/classes", { method: "POST", body: JSON.stringify({ name: newClassName }) });
      setNewClassName("");
      const firstClassId = await loadAll();
      await loadClassResults(firstClassId);
      addToast("Class created successfully.", "success");
    } catch (err) {
      addToast(String(err), "error");
    } finally {
      setBusy("createClass", false);
    }
  }

  async function handleCreateSection(e: FormEvent) {
    e.preventDefault();
    if (!sectionClassId) {
      addToast("Select a class.", "warning");
      return;
    }
    setBusy("createSection", true);
    try {
      await api("/api/sections", {
        method: "POST",
        body: JSON.stringify({ classId: sectionClassId, name: newSectionName, classTeacherName: teacherName }),
      });
      setNewSectionName("A");
      await loadAll();
      await loadClassResults();
      addToast("Section created successfully.", "success");
    } catch (err) {
      addToast(String(err), "error");
    } finally {
      setBusy("createSection", false);
    }
  }

  async function handleCreateSubject(e: FormEvent) {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      addToast("Subject name is required.", "warning");
      return;
    }
    setBusy("createSubject", true);
    try {
      await api("/api/subjects", { method: "POST", body: JSON.stringify({ name: newSubjectName }) });
      setNewSubjectName("");
      await loadAll();
      addToast("Subject created successfully.", "success");
    } catch (err) {
      addToast(String(err), "error");
    } finally {
      setBusy("createSubject", false);
    }
  }

  async function handleMapSubject(e: FormEvent) {
    e.preventDefault();
    setBusy("mapSubject", true);
    try {
      await api("/api/class-subjects", {
        method: "POST",
        body: JSON.stringify({ classId: mapClassId, subjectId: mapSubjectId }),
      });
      addToast("Subject mapped to class.", "success");
    } catch (err) {
      addToast(String(err), "error");
    } finally {
      setBusy("mapSubject", false);
    }
  }

  function startClassEdit(item: ClassItem) {
    setEditingClassId(item.id);
    setEditingClassName(item.name);
  }

  async function saveClassEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingClassId) return;
    setBusy("saveClass", true);
    try {
      await api(`/api/classes/${editingClassId}`, {
        method: "PUT",
        body: JSON.stringify({ name: editingClassName }),
      });
      setEditingClassId("");
      setEditingClassName("");
      const firstClassId = await loadAll();
      await loadClassResults(firstClassId);
      addToast("Class updated.", "success");
    } catch (err) {
      addToast(String(err), "error");
    } finally {
      setBusy("saveClass", false);
    }
  }

  function startSectionEdit(item: SectionItem) {
    setEditingSectionId(item.id);
    setEditingSectionForm({ classId: item.classId, name: item.name, classTeacherName: item.classTeacherName });
  }

  async function saveSectionEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingSectionId || !editingSectionForm) return;
    setBusy("saveSection", true);
    try {
      await api(`/api/sections/${editingSectionId}`, {
        method: "PUT",
        body: JSON.stringify(editingSectionForm),
      });
      setEditingSectionId("");
      setEditingSectionForm(null);
      await loadAll();
      await loadClassResults();
      addToast("Section updated.", "success");
    } catch (err) {
      addToast(String(err), "error");
    } finally {
      setBusy("saveSection", false);
    }
  }

  function startSubjectEdit(item: SubjectItem) {
    setEditingSubjectId(item.id);
    setEditingSubjectName(item.name);
  }

  async function saveSubjectEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingSubjectId) return;
    setBusy("saveSubject", true);
    try {
      await api(`/api/subjects/${editingSubjectId}`, {
        method: "PUT",
        body: JSON.stringify({ name: editingSubjectName }),
      });
      setEditingSubjectId("");
      setEditingSubjectName("");
      await loadAll();
      addToast("Subject updated.", "success");
    } catch (err) {
      addToast(String(err), "error");
    } finally {
      setBusy("saveSubject", false);
    }
  }

  async function getDeleteImpact(entity: DeleteImpactResponse["entity"], id: string) {
    return api<DeleteImpactResponse>(
      `/api/delete-impact?entity=${encodeURIComponent(entity)}&id=${encodeURIComponent(id)}`,
    );
  }

  async function deleteClass(id: string) {
    await api(`/api/classes/${id}`, { method: "DELETE" });
    const first = await loadAll();
    await loadClassResults(first);
    addToast("Class deleted.", "info");
  }

  async function confirmDeleteClass(id: string) {
    const impact = await getDeleteImpact("class", id);
    setConfirmDialog({
      title: `Delete Class: ${impact.name}`,
      message: "Deleting this class will cascade to related academic structure records.",
      warnings: [
        `${impact.counts.sections} sections belong to this class`,
        `${impact.counts.students} students are assigned`,
        `${impact.counts.classSubjects} class-subject mappings attached`,
        `${impact.counts.results} result rows linked`,
      ],
      confirmLabel: "Delete Class",
      onConfirm: async () => deleteClass(id),
    });
  }

  async function deleteSection(id: string) {
    await api(`/api/sections/${id}`, { method: "DELETE" });
    await loadAll();
    await loadClassResults();
    addToast("Section deleted.", "info");
  }

  async function confirmDeleteSection(id: string) {
    const impact = await getDeleteImpact("section", id);
    setConfirmDialog({
      title: `Delete Section: ${impact.name}`,
      message: "Sections cannot be removed safely while students are assigned.",
      warnings: [`${impact.counts.students} students are currently in this section`],
      confirmLabel: "Delete Section",
      onConfirm: async () => deleteSection(id),
    });
  }

  async function deleteSubject(id: string) {
    await api(`/api/subjects/${id}`, { method: "DELETE" });
    await loadAll();
    addToast("Subject deleted.", "info");
  }

  async function confirmDeleteSubject(id: string) {
    const impact = await getDeleteImpact("subject", id);
    setConfirmDialog({
      title: `Delete Subject: ${impact.name}`,
      message: "Subject deletion can fail when marks and mappings still exist.",
      warnings: [
        `${impact.counts.classMappings} class-subject mappings reference this subject`,
        `${impact.counts.marks} marks entries reference this subject`,
      ],
      confirmLabel: "Delete Subject",
      onConfirm: async () => deleteSubject(id),
    });
  }

  async function handleCreateStudent(e: FormEvent) {
    e.preventDefault();
    setBusy("createStudent", true);
    try {
      await api("/api/students", { method: "POST", body: JSON.stringify(studentForm) });
      setStudentForm((p) => ({ ...p, name: "", parentName: "", contact: "", dateOfBirth: "" }));
      await loadAll();
      await loadStudentDirectory();
      addToast("Student added successfully.", "success");
    } catch (err) {
      addToast(String(err), "error");
    } finally {
      setBusy("createStudent", false);
    }
  }

  function startEditStudent(s: StudentItem) {
    setEditingStudentId(s.id);
    setEditStudentForm({
      admissionNumber: s.admissionNumber,
      name: s.name,
      classId: s.classId,
      sectionId: s.sectionId,
      dateOfBirth: toDateInput(s.dateOfBirth),
      parentName: s.parentName ?? "",
      contact: s.contact ?? "",
    });
  }

  async function saveEditedStudent(e: FormEvent) {
    e.preventDefault();
    if (!editingStudentId || !editStudentForm) return;
    setBusy("saveStudent", true);
    try {
      await api(`/api/students/${editingStudentId}`, {
        method: "PUT",
        body: JSON.stringify(editStudentForm),
      });
      setEditingStudentId("");
      setEditStudentForm(null);
      await loadAll();
      await loadStudentDirectory();
      addToast("Student updated.", "success");
    } catch (err) {
      addToast(String(err), "error");
    } finally {
      setBusy("saveStudent", false);
    }
  }

  async function deleteStudent(studentId: string) {
    await api(`/api/students/${studentId}`, { method: "DELETE" });
    await loadAll();
    await loadStudentDirectory();
    addToast("Student deleted.", "info");
  }

  async function confirmDeleteStudent(studentId: string) {
    const impact = await getDeleteImpact("student", studentId);
    setConfirmDialog({
      title: `Delete Student: ${impact.name}`,
      message: "This will permanently remove linked marks and computed results.",
      warnings: [
        `${impact.counts.className} - ${impact.counts.sectionName}`,
        `${impact.counts.marks} marks rows will be removed`,
        `${impact.counts.results} result rows will be removed`,
      ],
      confirmLabel: "Delete Student",
      onConfirm: async () => deleteStudent(studentId),
    });
  }

  async function loadStudentMarks(studentId: string) {
    if (!studentId) {
      setMarkRows([]);
      setSelectedStudentId("");
      return;
    }
    setSelectedStudentId(studentId);
    setBusy("loadMarks", true);
    try {
      const data = await api<{ rows: MarkRow[] }>(`/api/marks/${studentId}`);
      setMarkRows(data.rows);
    } catch (err) {
      addToast(String(err), "error");
    } finally {
      setBusy("loadMarks", false);
    }
  }

  async function saveMarks() {
    if (!selectedStudentId) return;
    setBusy("saveMarks", true);
    try {
      await api(`/api/marks/${selectedStudentId}`, {
        method: "PUT",
        body: JSON.stringify({
          marks: markRows.map((r) => ({
            subjectId: r.subjectId,
            halfYearlyMarks: Number(r.halfYearlyMarks),
            finalTermMarks: Number(r.finalTermMarks),
          })),
        }),
      });
      addToast("Marks saved and result recalculated.", "success");
    } catch (err) {
      addToast(String(err), "error");
    } finally {
      setBusy("saveMarks", false);
    }
  }

  async function importStudentsExcel() {
    if (!importFile) {
      addToast("Select an .xlsx file first.", "warning");
      return;
    }
    setBusy("import", true);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      const response = await fetch("/api/students/import", { method: "POST", body: fd });
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        data?: { importedCount: number; duplicateCount: number };
      };
      if (!response.ok || payload.success === false) {
        addToast(payload.message ?? "Import failed", "error");
        return;
      }
      addToast(
        `Import complete: ${payload.data?.importedCount ?? 0} added, ${payload.data?.duplicateCount ?? 0} skipped.`,
        "success",
      );
      setImportFile(null);
      await loadAll();
      await loadStudentDirectory();
    } catch (err) {
      addToast(String(err), "error");
    } finally {
      setBusy("import", false);
    }
  }

  async function saveGradeRanges(e: FormEvent) {
    e.preventDefault();
    setBusy("saveGrading", true);
    try {
      await api("/api/grading", {
        method: "PUT",
        body: JSON.stringify({
          ranges: gradeRanges.map((r) => ({ min: Number(r.min), max: Number(r.max), grade: r.grade })),
        }),
      });
      addToast("Grading ranges updated.", "success");
      await loadGradeRanges();
      await loadClassResults();
    } catch (err) {
      addToast(String(err), "error");
    } finally {
      setBusy("saveGrading", false);
    }
  }

  async function confirmDeleteAction() {
    if (!confirmDialog) return;
    setConfirmBusy(true);
    try {
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } catch (err) {
      addToast(String(err), "error");
    } finally {
      setConfirmBusy(false);
    }
  }

  async function downloadBlob(url: string, filename: string, busyKey: string) {
    setBusy(busyKey, true);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const p = (await response.json().catch(() => ({}))) as { message?: string };
        addToast(p.message ?? "Download failed", "error");
        return;
      }
      const blob = await response.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(objUrl);
    } catch (err) {
      addToast(String(err), "error");
    } finally {
      setBusy(busyKey, false);
    }
  }

  /* ── Stat card gradients ── */
  const statGradients = [
    "linear-gradient(135deg,#6366f1,#8b5cf6)",
    "linear-gradient(135deg,#06b6d4,#3b82f6)",
    "linear-gradient(135deg,#10b981,#059669)",
    "linear-gradient(135deg,#f59e0b,#ef4444)",
    "linear-gradient(135deg,#ec4899,#8b5cf6)",
  ];
  const statIcons = [ICONS.students, ICONS.setup, ICONS.marks, ICONS.results, ICONS.grading];

  /* ──────────────────────────────── Auth check */

  if (authChecking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Spinner size={48} />
          <p style={{ marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading…</p>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────── Login */

  if (!loggedIn) {
    return (
      <>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: darkMode
              ? "radial-gradient(ellipse at 30% 20%,#1e1b4b 0%,#0f172a 60%)"
              : "radial-gradient(ellipse at 30% 20%,#e0e7ff 0%,#f1f5f9 60%)",
            padding: "1rem",
          }}
        >
          <button
            className="btn btn-soft btn-icon"
            onClick={toggleTheme}
            style={{ position: "fixed", top: "1rem", right: "1rem" }}
            title="Toggle theme"
          >
            <Icon d={darkMode ? ICONS.sun : ICONS.moon} size={18} />
          </button>

          <div className="card section-enter" style={{ width: "100%", maxWidth: 420, padding: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <Icon d={ICONS.results} size={24} />
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text)", margin: 0 }}>School RMS</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                  Result Management System
                </p>
              </div>
            </div>

            <h1
              style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text)", margin: "0 0 0.35rem" }}
            >
              Welcome back
            </h1>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              Sign in to your admin account
            </p>

            <form
              style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}
              onSubmit={(e) => void handleLogin(e)}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginBottom: "0.35rem",
                  }}
                >
                  Email address
                </label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@school.local"
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginBottom: "0.35rem",
                  }}
                >
                  Password
                </label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.4rem" }}>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={loginBusy}
                  style={{ flex: 1, padding: "0.65rem" }}
                >
                  {loginBusy ? (
                    <>
                      <Spinner size={14} /> Signing in…
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
                <button
                  className="btn btn-soft"
                  type="button"
                  onClick={() => void handleInitialize()}
                  disabled={isBusy("init")}
                >
                  {isBusy("init") ? <Spinner size={14} /> : "Initialize"}
                </button>
              </div>
            </form>
          </div>
        </div>
        <ToastList toasts={toasts} dismiss={dismissToast} />
      </>
    );
  }

  /* ──────────────────────────────── Nav config */

  const navItems: { key: Tab; label: string; icon: string; badge?: number }[] = [
    { key: "dashboard", label: "Dashboard", icon: ICONS.dashboard },
    { key: "setup", label: "Setup", icon: ICONS.setup },
    { key: "students", label: "Students", icon: ICONS.students, badge: students.length || undefined },
    { key: "marks", label: "Marks Entry", icon: ICONS.marks },
    { key: "results", label: "Results", icon: ICONS.results },
    { key: "reports", label: "Reports", icon: ICONS.reports },
    { key: "grading", label: "Grading", icon: ICONS.grading },
  ];

  /* ──────────────────────────────── Render */

  return (
    <>
      {/* Loading bar */}
      {globalLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "var(--primary)",
            zIndex: 9999,
            animation: "shimmer 1.4s infinite",
            backgroundImage: "linear-gradient(90deg,var(--primary) 0%,#a5b4fc 50%,var(--primary) 100%)",
            backgroundSize: "200% 100%",
          }}
        />
      )}

      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar */}
        <aside
          className={`sidebar${sidebarOpen ? " open" : ""}`}
          style={{
            width: 236,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            padding: "1.25rem 0.75rem",
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 100,
            overflowY: "auto",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0 0.5rem",
              marginBottom: "1.75rem",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#fff",
              }}
            >
              <Icon d={ICONS.results} size={20} />
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff", margin: 0, lineHeight: 1.2 }}>
                School RMS
              </p>
              <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.55)", margin: 0 }}>Admin Panel</p>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.2rem", flex: 1 }}>
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`sidebar-item${activeTab === item.key ? " active" : ""}`}
                onClick={() => {
                  setActiveTab(item.key);
                  setSidebarOpen(false);
                }}
              >
                <Icon d={item.icon} size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    style={{
                      background: "rgba(255,255,255,0.22)",
                      borderRadius: 9999,
                      padding: "0.1rem 0.45rem",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Bottom actions */}
          <div
            style={{
              marginTop: "1rem",
              borderTop: "1px solid rgba(255,255,255,0.12)",
              paddingTop: "0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.2rem",
            }}
          >
            <button className="sidebar-item" onClick={toggleTheme}>
              <Icon d={darkMode ? ICONS.sun : ICONS.moon} size={18} />
              <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <button className="sidebar-item" onClick={() => void handleLogout()}>
              <Icon d={ICONS.logout} size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div
            className="modal-overlay"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 99,
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main */}
        <main style={{ flex: 1, marginLeft: 236, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <header
            style={{
              background: "var(--surface)",
              borderBottom: "1px solid var(--border)",
              padding: "0 1.5rem",
              height: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "sticky",
              top: 0,
              zIndex: 50,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                className="btn btn-soft btn-icon"
                onClick={() => setSidebarOpen(true)}
                id="mobileMenuBtn"
                style={{ display: "none" }}
              >
                <Icon d={ICONS.menu} size={18} />
              </button>
              <div>
                <h1
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--text)",
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  {navItems.find((n) => n.key === activeTab)?.label}
                </h1>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0 }}>
                  School Result Management System
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                className="btn btn-soft btn-sm"
                onClick={() =>
                  void downloadBlob("/api/results?format=excel", "results.xlsx", "exportResults")
                }
                disabled={isBusy("exportResults")}
              >
                {isBusy("exportResults") ? <Spinner size={13} /> : <Icon d={ICONS.excel} size={14} />}
                <span>Export Results</span>
              </button>
              <button
                className="btn btn-soft btn-sm"
                onClick={() =>
                  void downloadBlob("/api/students/export", "students.xlsx", "exportStudents")
                }
                disabled={isBusy("exportStudents")}
              >
                {isBusy("exportStudents") ? <Spinner size={13} /> : <Icon d={ICONS.download} size={14} />}
                <span>Export Students</span>
              </button>
              <button className="btn btn-soft btn-icon" onClick={toggleTheme} title="Toggle theme">
                <Icon d={darkMode ? ICONS.sun : ICONS.moon} size={18} />
              </button>
            </div>
          </header>

          {/* Content */}
          <div style={{ padding: "1.75rem", flex: 1 }}>

            {/* ─── DASHBOARD ─── */}
            {activeTab === "dashboard" && (
              <div className="section-enter">
                <SectionHeader title="Dashboard" subtitle="System overview at a glance" />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))",
                    gap: "1rem",
                    marginBottom: "1.75rem",
                  }}
                >
                  {Object.entries(dashboard).map(([label, value], i) => (
                    <div
                      key={label}
                      className="stat-card"
                      style={{ background: statGradients[i % statGradients.length] }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <p
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              opacity: 0.85,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              margin: "0 0 0.5rem",
                            }}
                          >
                            {label}
                          </p>
                          <p style={{ fontSize: "2rem", fontWeight: 800, margin: 0, lineHeight: 1 }}>
                            {value}
                          </p>
                        </div>
                        <div style={{ opacity: 0.7 }}>
                          <Icon d={statIcons[i % statIcons.length]} size={28} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <SectionHeader title="Quick Actions" />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
                    gap: "0.75rem",
                  }}
                >
                  {(
                    [
                      { label: "Add Student", tab: "students" as Tab, icon: ICONS.students, color: "var(--primary)" },
                      { label: "Enter Marks", tab: "marks" as Tab, icon: ICONS.marks, color: "#06b6d4" },
                      { label: "View Results", tab: "results" as Tab, icon: ICONS.results, color: "#10b981" },
                      {
                        label: "Generate Reports",
                        tab: "reports" as Tab,
                        icon: ICONS.reports,
                        color: "#f59e0b",
                      },
                    ] as const
                  ).map((qa) => (
                    <button
                      key={qa.label}
                      className="card"
                      onClick={() => setActiveTab(qa.tab)}
                      style={{
                        padding: "1.1rem 1.25rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.9rem",
                        cursor: "pointer",
                        border: "1px solid var(--border)",
                        textAlign: "left",
                        width: "100%",
                        background: "var(--surface)",
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: qa.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        <Icon d={qa.icon} size={20} />
                      </div>
                      <span style={{ fontWeight: 600, color: "var(--text)", fontSize: "0.9rem" }}>
                        {qa.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── SETUP ─── */}
            {activeTab === "setup" && (
              <div className="section-enter">
                <SectionHeader
                  title="System Setup"
                  subtitle="Manage classes, sections, subjects and their mappings"
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                  {/* Create class */}
                  <div className="card" style={{ padding: "1.25rem" }}>
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "var(--text)",
                        marginBottom: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Icon d={ICONS.setup} size={15} /> Create Class
                    </p>
                    <form style={{ display: "flex", gap: "0.5rem" }} onSubmit={(e) => void handleCreateClass(e)}>
                      <input
                        className="input"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="e.g. Grade 10"
                      />
                      <button className="btn btn-primary" type="submit" disabled={isBusy("createClass")}>
                        {isBusy("createClass") ? <Spinner size={14} /> : <Icon d={ICONS.plus} size={14} />} Add
                      </button>
                    </form>
                  </div>

                  {/* Create subject */}
                  <div className="card" style={{ padding: "1.25rem" }}>
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "var(--text)",
                        marginBottom: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Icon d={ICONS.marks} size={15} /> Create Subject
                    </p>
                    <form
                      style={{ display: "flex", gap: "0.5rem" }}
                      onSubmit={(e) => void handleCreateSubject(e)}
                    >
                      <input
                        className="input"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        placeholder="e.g. Mathematics"
                      />
                      <button className="btn btn-primary" type="submit" disabled={isBusy("createSubject")}>
                        {isBusy("createSubject") ? <Spinner size={14} /> : <Icon d={ICONS.plus} size={14} />}{" "}
                        Add
                      </button>
                    </form>
                  </div>

                  {/* Create section */}
                  <div className="card" style={{ padding: "1.25rem" }}>
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "var(--text)",
                        marginBottom: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Icon d={ICONS.students} size={15} /> Create Section
                    </p>
                    <form
                      style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
                      onSubmit={(e) => void handleCreateSection(e)}
                    >
                      <select
                        className="input"
                        value={sectionClassId}
                        onChange={(e) => setSectionClassId(e.target.value)}
                      >
                        <option value="">Select class</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          className="input"
                          value={newSectionName}
                          onChange={(e) => setNewSectionName(e.target.value)}
                          placeholder="Section (A, B…)"
                        />
                        <input
                          className="input"
                          value={teacherName}
                          onChange={(e) => setTeacherName(e.target.value)}
                          placeholder="Class teacher"
                        />
                        <button
                          className="btn btn-primary"
                          type="submit"
                          disabled={isBusy("createSection")}
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {isBusy("createSection") ? <Spinner size={14} /> : <Icon d={ICONS.plus} size={14} />}{" "}
                          Add
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Map subject */}
                  <div className="card" style={{ padding: "1.25rem" }}>
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "var(--text)",
                        marginBottom: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Icon d={ICONS.results} size={15} /> Map Subject to Class
                    </p>
                    <form
                      style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
                      onSubmit={(e) => void handleMapSubject(e)}
                    >
                      <select
                        className="input"
                        value={mapClassId}
                        onChange={(e) => setMapClassId(e.target.value)}
                      >
                        <option value="">Select class</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <select
                        className="input"
                        value={mapSubjectId}
                        onChange={(e) => setMapSubjectId(e.target.value)}
                      >
                        <option value="">Select subject</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <button className="btn btn-primary" type="submit" disabled={isBusy("mapSubject")}>
                        {isBusy("mapSubject") ? <Spinner size={14} /> : null} Map Subject
                      </button>
                    </form>
                  </div>
                </div>

                {/* Lists */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "1.25rem",
                    marginTop: "1.25rem",
                  }}
                >
                  {/* Classes */}
                  <div className="card" style={{ padding: "1.25rem" }}>
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "var(--text)",
                        marginBottom: "0.7rem",
                      }}
                    >
                      Classes ({classes.length})
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                        maxHeight: 280,
                        overflowY: "auto",
                      }}
                    >
                      {classes.map((item) =>
                        editingClassId === item.id ? (
                          <form
                            key={item.id}
                            className="list-row"
                            onSubmit={(e) => void saveClassEdit(e)}
                            style={{ flexDirection: "column", alignItems: "stretch" }}
                          >
                            <input
                              className="input"
                              value={editingClassName}
                              onChange={(e) => setEditingClassName(e.target.value)}
                            />
                            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem" }}>
                              <button
                                className="btn btn-primary btn-sm"
                                type="submit"
                                disabled={isBusy("saveClass")}
                              >
                                {isBusy("saveClass") ? <Spinner size={12} /> : null} Save
                              </button>
                              <button
                                className="btn btn-soft btn-sm"
                                type="button"
                                onClick={() => {
                                  setEditingClassId("");
                                  setEditingClassName("");
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div key={item.id} className="list-row">
                            <span
                              style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text)" }}
                            >
                              {item.name}
                            </span>
                            <div style={{ display: "flex", gap: "0.3rem" }}>
                              <button
                                className="btn btn-soft btn-icon btn-sm"
                                onClick={() => startClassEdit(item)}
                                title="Edit"
                              >
                                <Icon d={ICONS.edit} size={14} />
                              </button>
                              <button
                                className="btn btn-soft btn-icon btn-sm"
                                onClick={() => void confirmDeleteClass(item.id)}
                                title="Delete"
                              >
                                <Icon d={ICONS.delete} size={14} />
                              </button>
                            </div>
                          </div>
                        ),
                      )}
                      {classes.length === 0 && (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>No classes yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Sections */}
                  <div className="card" style={{ padding: "1.25rem" }}>
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "var(--text)",
                        marginBottom: "0.7rem",
                      }}
                    >
                      Sections ({sections.length})
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                        maxHeight: 280,
                        overflowY: "auto",
                      }}
                    >
                      {sections.map((item) =>
                        editingSectionId === item.id && editingSectionForm ? (
                          <form
                            key={item.id}
                            className="list-row"
                            onSubmit={(e) => void saveSectionEdit(e)}
                            style={{ flexDirection: "column", alignItems: "stretch" }}
                          >
                            <select
                              className="input"
                              value={editingSectionForm.classId}
                              onChange={(e) =>
                                setEditingSectionForm((p) => (p ? { ...p, classId: e.target.value } : p))
                              }
                            >
                              {classes.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                            <input
                              className="input"
                              style={{ marginTop: "0.3rem" }}
                              value={editingSectionForm.name}
                              onChange={(e) =>
                                setEditingSectionForm((p) => (p ? { ...p, name: e.target.value } : p))
                              }
                              placeholder="Section name"
                            />
                            <input
                              className="input"
                              style={{ marginTop: "0.3rem" }}
                              value={editingSectionForm.classTeacherName}
                              onChange={(e) =>
                                setEditingSectionForm((p) =>
                                  p ? { ...p, classTeacherName: e.target.value } : p,
                                )
                              }
                              placeholder="Teacher name"
                            />
                            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem" }}>
                              <button
                                className="btn btn-primary btn-sm"
                                type="submit"
                                disabled={isBusy("saveSection")}
                              >
                                {isBusy("saveSection") ? <Spinner size={12} /> : null} Save
                              </button>
                              <button
                                className="btn btn-soft btn-sm"
                                type="button"
                                onClick={() => {
                                  setEditingSectionId("");
                                  setEditingSectionForm(null);
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div key={item.id} className="list-row">
                            <div>
                              <p
                                style={{
                                  fontWeight: 600,
                                  fontSize: "0.875rem",
                                  color: "var(--text)",
                                  margin: 0,
                                }}
                              >
                                {item.class.name} – {item.name}
                              </p>
                              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                                {item.classTeacherName || "No teacher"}
                              </p>
                            </div>
                            <div style={{ display: "flex", gap: "0.3rem" }}>
                              <button
                                className="btn btn-soft btn-icon btn-sm"
                                onClick={() => startSectionEdit(item)}
                                title="Edit"
                              >
                                <Icon d={ICONS.edit} size={14} />
                              </button>
                              <button
                                className="btn btn-soft btn-icon btn-sm"
                                onClick={() => void confirmDeleteSection(item.id)}
                                title="Delete"
                              >
                                <Icon d={ICONS.delete} size={14} />
                              </button>
                            </div>
                          </div>
                        ),
                      )}
                      {sections.length === 0 && (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>No sections yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Subjects */}
                  <div className="card" style={{ padding: "1.25rem" }}>
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "var(--text)",
                        marginBottom: "0.7rem",
                      }}
                    >
                      Subjects ({subjects.length})
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                        maxHeight: 280,
                        overflowY: "auto",
                      }}
                    >
                      {subjects.map((item) =>
                        editingSubjectId === item.id ? (
                          <form
                            key={item.id}
                            className="list-row"
                            onSubmit={(e) => void saveSubjectEdit(e)}
                            style={{ flexDirection: "column", alignItems: "stretch" }}
                          >
                            <input
                              className="input"
                              value={editingSubjectName}
                              onChange={(e) => setEditingSubjectName(e.target.value)}
                            />
                            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem" }}>
                              <button
                                className="btn btn-primary btn-sm"
                                type="submit"
                                disabled={isBusy("saveSubject")}
                              >
                                {isBusy("saveSubject") ? <Spinner size={12} /> : null} Save
                              </button>
                              <button
                                className="btn btn-soft btn-sm"
                                type="button"
                                onClick={() => {
                                  setEditingSubjectId("");
                                  setEditingSubjectName("");
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div key={item.id} className="list-row">
                            <span
                              style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text)" }}
                            >
                              {item.name}
                            </span>
                            <div style={{ display: "flex", gap: "0.3rem" }}>
                              <button
                                className="btn btn-soft btn-icon btn-sm"
                                onClick={() => startSubjectEdit(item)}
                                title="Edit"
                              >
                                <Icon d={ICONS.edit} size={14} />
                              </button>
                              <button
                                className="btn btn-soft btn-icon btn-sm"
                                onClick={() => void confirmDeleteSubject(item.id)}
                                title="Delete"
                              >
                                <Icon d={ICONS.delete} size={14} />
                              </button>
                            </div>
                          </div>
                        ),
                      )}
                      {subjects.length === 0 && (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>No subjects yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── STUDENTS ─── */}
            {activeTab === "students" && (
              <div className="section-enter">
                <SectionHeader
                  title="Student Management"
                  subtitle="Add, edit, search and manage student records"
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "340px 1fr",
                    gap: "1.25rem",
                    alignItems: "start",
                  }}
                >
                  {/* Add student */}
                  <div className="card" style={{ padding: "1.25rem" }}>
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "var(--text)",
                        marginBottom: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Icon d={ICONS.students} size={16} /> Add New Student
                    </p>
                    <form
                      style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
                      onSubmit={(e) => void handleCreateStudent(e)}
                    >
                      <input
                        className="input"
                        value={studentForm.admissionNumber}
                        onChange={(e) => setStudentForm((p) => ({ ...p, admissionNumber: e.target.value }))}
                        placeholder="Admission number"
                      />
                      <input
                        className="input"
                        value={studentForm.name}
                        onChange={(e) => setStudentForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Full name"
                      />
                      <select
                        className="input"
                        value={studentForm.classId}
                        onChange={(e) =>
                          setStudentForm((p) => ({ ...p, classId: e.target.value, sectionId: "" }))
                        }
                      >
                        <option value="">Select class</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <select
                        className="input"
                        value={studentForm.sectionId}
                        onChange={(e) => setStudentForm((p) => ({ ...p, sectionId: e.target.value }))}
                      >
                        <option value="">Select section</option>
                        {sectionOptions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <input
                        className="input"
                        type="date"
                        value={studentForm.dateOfBirth}
                        onChange={(e) => setStudentForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                      />
                      <input
                        className="input"
                        value={studentForm.parentName}
                        onChange={(e) => setStudentForm((p) => ({ ...p, parentName: e.target.value }))}
                        placeholder="Parent / guardian name"
                      />
                      <input
                        className="input"
                        value={studentForm.contact}
                        onChange={(e) => setStudentForm((p) => ({ ...p, contact: e.target.value }))}
                        placeholder="Contact number"
                      />
                      <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={isBusy("createStudent")}
                        style={{ marginTop: "0.2rem" }}
                      >
                        {isBusy("createStudent") ? (
                          <>
                            <Spinner size={14} /> Adding…
                          </>
                        ) : (
                          <>
                            <Icon d={ICONS.plus} size={14} /> Add Student
                          </>
                        )}
                      </button>
                    </form>

                    <div
                      style={{
                        marginTop: "1rem",
                        paddingTop: "1rem",
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 600,
                          fontSize: "0.82rem",
                          color: "var(--text)",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Import from Excel
                      </p>
                      <input
                        className="input"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                        style={{ marginBottom: "0.5rem" }}
                      />
                      <button
                        className="btn btn-soft"
                        style={{ width: "100%" }}
                        onClick={() => void importStudentsExcel()}
                        disabled={isBusy("import")}
                      >
                        {isBusy("import") ? (
                          <>
                            <Spinner size={14} /> Importing…
                          </>
                        ) : (
                          <>
                            <Icon d={ICONS.upload} size={14} /> Import Excel
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Directory */}
                  <div className="card" style={{ padding: "1.25rem" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "0.85rem",
                      }}
                    >
                      <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)", margin: 0 }}>
                        Student Directory
                      </p>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {studentDirectoryTotal} students
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <input
                        className="input"
                        placeholder="Search by name or admission no."
                        value={studentDirectorySearchInput}
                        onChange={(e) => setStudentDirectorySearchInput(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <select
                        className="input"
                        style={{ width: 150 }}
                        value={studentDirectoryClassId}
                        onChange={(e) => {
                          const classId = e.target.value;
                          setStudentDirectoryClassId(classId);
                          setStudentDirectoryPage(1);
                          void loadStudentDirectory({
                            page: 1,
                            classId,
                            query: studentDirectorySearchInput,
                          });
                        }}
                      >
                        <option value="">All classes</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                        maxHeight: 360,
                        overflowY: "auto",
                      }}
                    >
                      {studentDirectory.map((student) => (
                        <div key={student.id} className="list-row">
                          <div>
                            <p
                              style={{
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                color: "var(--text)",
                                margin: 0,
                              }}
                            >
                              {student.name}
                            </p>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                              {student.admissionNumber} &middot; {student.class.name}–{student.section.name}
                            </p>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                              {student.parentName ?? "—"} &middot; {student.contact ?? "—"}
                            </p>
                          </div>
                          <div style={{ display: "flex", gap: "0.3rem" }}>
                            <button
                              className="btn btn-soft btn-icon btn-sm"
                              onClick={() => startEditStudent(student)}
                              title="Edit"
                            >
                              <Icon d={ICONS.edit} size={14} />
                            </button>
                            <button
                              className="btn btn-soft btn-icon btn-sm"
                              onClick={() => void confirmDeleteStudent(student.id)}
                              title="Delete"
                            >
                              <Icon d={ICONS.delete} size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {studentDirectory.length === 0 && (
                        <p
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.85rem",
                            textAlign: "center",
                            padding: "1.5rem 0",
                          }}
                        >
                          No students found.
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "0.75rem",
                        paddingTop: "0.75rem",
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Page {studentDirectoryPage} of {directoryTotalPages}
                      </span>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button
                          className="btn btn-soft btn-sm"
                          disabled={studentDirectoryPage <= 1}
                          onClick={() => {
                            const p = Math.max(1, studentDirectoryPage - 1);
                            setStudentDirectoryPage(p);
                            void loadStudentDirectory({
                              page: p,
                              classId: studentDirectoryClassId,
                              query: studentDirectoryQuery,
                            });
                          }}
                        >
                          <Icon d={ICONS.chevronLeft} size={14} />
                        </button>
                        <button
                          className="btn btn-soft btn-sm"
                          disabled={studentDirectoryPage >= directoryTotalPages}
                          onClick={() => {
                            const p = Math.min(directoryTotalPages, studentDirectoryPage + 1);
                            setStudentDirectoryPage(p);
                            void loadStudentDirectory({
                              page: p,
                              classId: studentDirectoryClassId,
                              query: studentDirectoryQuery,
                            });
                          }}
                        >
                          <Icon d={ICONS.chevronRight} size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit student modal */}
                {editingStudentId && editStudentForm && (
                  <div
                    className="modal-overlay"
                    style={{
                      position: "fixed",
                      inset: 0,
                      background: "rgba(0,0,0,0.45)",
                      zIndex: 200,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "1rem",
                    }}
                  >
                    <div className="card modal-box" style={{ width: "100%", maxWidth: 480, padding: "1.5rem" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "1rem",
                        }}
                      >
                        <h3
                          style={{
                            fontWeight: 700,
                            fontSize: "1.1rem",
                            color: "var(--text)",
                            margin: 0,
                          }}
                        >
                          Edit Student
                        </h3>
                        <button
                          className="btn btn-soft btn-icon"
                          onClick={() => {
                            setEditingStudentId("");
                            setEditStudentForm(null);
                          }}
                        >
                          <Icon d={ICONS.close} size={16} />
                        </button>
                      </div>
                      <form
                        style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}
                        onSubmit={(e) => void saveEditedStudent(e)}
                      >
                        <input
                          className="input"
                          value={editStudentForm.admissionNumber}
                          disabled
                          style={{ opacity: 0.6 }}
                        />
                        <input
                          className="input"
                          value={editStudentForm.name}
                          onChange={(e) =>
                            setEditStudentForm((p) => (p ? { ...p, name: e.target.value } : p))
                          }
                          placeholder="Student name"
                        />
                        <select
                          className="input"
                          value={editStudentForm.classId}
                          onChange={(e) =>
                            setEditStudentForm((p) =>
                              p ? { ...p, classId: e.target.value, sectionId: "" } : p,
                            )
                          }
                        >
                          <option value="">Select class</option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <select
                          className="input"
                          value={editStudentForm.sectionId}
                          onChange={(e) =>
                            setEditStudentForm((p) => (p ? { ...p, sectionId: e.target.value } : p))
                          }
                        >
                          <option value="">Select section</option>
                          {editSectionOptions.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <input
                          className="input"
                          type="date"
                          value={editStudentForm.dateOfBirth}
                          onChange={(e) =>
                            setEditStudentForm((p) => (p ? { ...p, dateOfBirth: e.target.value } : p))
                          }
                        />
                        <input
                          className="input"
                          value={editStudentForm.parentName}
                          onChange={(e) =>
                            setEditStudentForm((p) => (p ? { ...p, parentName: e.target.value } : p))
                          }
                          placeholder="Parent name"
                        />
                        <input
                          className="input"
                          value={editStudentForm.contact}
                          onChange={(e) =>
                            setEditStudentForm((p) => (p ? { ...p, contact: e.target.value } : p))
                          }
                          placeholder="Contact"
                        />
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
                          <button
                            className="btn btn-primary"
                            type="submit"
                            disabled={isBusy("saveStudent")}
                            style={{ flex: 1 }}
                          >
                            {isBusy("saveStudent") ? (
                              <>
                                <Spinner size={14} /> Saving…
                              </>
                            ) : (
                              "Save Changes"
                            )}
                          </button>
                          <button
                            className="btn btn-soft"
                            type="button"
                            onClick={() => {
                              setEditingStudentId("");
                              setEditStudentForm(null);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── MARKS ─── */}
            {activeTab === "marks" && (
              <div className="section-enter">
                <SectionHeader
                  title="Marks Entry"
                  subtitle="Enter half-yearly and final term marks per subject"
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "280px 1fr",
                    gap: "1.25rem",
                    alignItems: "start",
                  }}
                >
                  <div className="card" style={{ padding: "1.25rem" }}>
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "var(--text)",
                        marginBottom: "0.75rem",
                      }}
                    >
                      Select Student
                    </p>
                    <select
                      className="input"
                      value={selectedStudentId}
                      onChange={(e) => void loadStudentMarks(e.target.value)}
                    >
                      <option value="">Choose a student…</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.admissionNumber} — {s.name} ({s.class.name}-{s.section.name})
                        </option>
                      ))}
                    </select>
                    {isBusy("loadMarks") && (
                      <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "center" }}>
                        <Spinner size={24} />
                      </div>
                    )}
                  </div>

                  {markRows.length > 0 && (
                    <div className="card" style={{ padding: "1.25rem" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "0.85rem",
                        }}
                      >
                        <p
                          style={{
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            color: "var(--text)",
                            margin: 0,
                          }}
                        >
                          Subject Marks
                        </p>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => void saveMarks()}
                          disabled={isBusy("saveMarks")}
                        >
                          {isBusy("saveMarks") ? (
                            <>
                              <Spinner size={13} /> Saving…
                            </>
                          ) : (
                            "Save Marks"
                          )}
                        </button>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 120px 120px 80px",
                          gap: "0.5rem",
                          padding: "0 0.5rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {["Subject", "Half Yearly", "Final Term", "Total"].map((h) => (
                          <span
                            key={h}
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {h}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        {markRows.map((row, i) => (
                          <div
                            key={row.subjectId}
                            className="list-row"
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 120px 120px 80px",
                              gap: "0.5rem",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                color: "var(--text)",
                                alignSelf: "center",
                              }}
                            >
                              {row.subjectName}
                            </span>
                            <input
                              className="input"
                              type="number"
                              min={0}
                              max={100}
                              value={row.halfYearlyMarks}
                              onChange={(e) => {
                                const half = Number(e.target.value);
                                setMarkRows((prev) =>
                                  prev.map((item, idx) =>
                                    idx === i
                                      ? {
                                          ...item,
                                          halfYearlyMarks: half,
                                          totalMarks: Number((half + item.finalTermMarks).toFixed(2)),
                                        }
                                      : item,
                                  ),
                                );
                              }}
                            />
                            <input
                              className="input"
                              type="number"
                              min={0}
                              max={100}
                              value={row.finalTermMarks}
                              onChange={(e) => {
                                const final = Number(e.target.value);
                                setMarkRows((prev) =>
                                  prev.map((item, idx) =>
                                    idx === i
                                      ? {
                                          ...item,
                                          finalTermMarks: final,
                                          totalMarks: Number((item.halfYearlyMarks + final).toFixed(2)),
                                        }
                                      : item,
                                  ),
                                );
                              }}
                            />
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <span className="badge">{row.totalMarks}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!selectedStudentId && markRows.length === 0 && (
                    <div
                      className="card"
                      style={{
                        padding: "3rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.75rem",
                        opacity: 0.55,
                        color: "var(--text-muted)",
                      }}
                    >
                      <Icon d={ICONS.marks} size={48} />
                      <p style={{ fontSize: "0.9rem", margin: 0 }}>Select a student to enter marks</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── RESULTS ─── */}
            {activeTab === "results" && (
              <div className="section-enter">
                <SectionHeader
                  title="Class Results & Rankings"
                  subtitle="View ranked results for each class"
                />

                <div
                  style={{
                    display: "flex",
                    gap: "0.6rem",
                    flexWrap: "wrap",
                    marginBottom: "1rem",
                    alignItems: "center",
                  }}
                >
                  <select
                    className="input"
                    style={{ maxWidth: 200 }}
                    value={selectedResultsClassId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setSelectedResultsClassId(cid);
                      void loadClassResults(cid);
                    }}
                  >
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <input
                    className="input"
                    style={{ flex: 1, minWidth: 180 }}
                    placeholder="Search ranked students…"
                    value={rankingSearchInput}
                    onChange={(e) => setRankingSearchInput(e.target.value)}
                  />

                  <button className="btn btn-soft btn-sm" onClick={() => void loadClassResults()}>
                    <Icon d={ICONS.refresh} size={14} /> Refresh
                  </button>
                  <button
                    className="btn btn-soft btn-sm"
                    onClick={() =>
                      void downloadBlob(
                        `/api/results?format=excel&classId=${encodeURIComponent(selectedResultsClassId)}`,
                        "class-results.xlsx",
                        "dlClassExcel",
                      )
                    }
                    disabled={isBusy("dlClassExcel")}
                  >
                    {isBusy("dlClassExcel") ? <Spinner size={13} /> : <Icon d={ICONS.excel} size={14} />} Export
                    Excel
                  </button>
                  <button
                    className="btn btn-soft btn-sm"
                    onClick={() =>
                      void downloadBlob(
                        `/api/reports/class/${selectedResultsClassId}`,
                        "class-report-cards.zip",
                        "dlZip",
                      )
                    }
                    disabled={isBusy("dlZip") || !selectedResultsClassId}
                  >
                    {isBusy("dlZip") ? <Spinner size={13} /> : <Icon d={ICONS.zip} size={14} />} All PDFs (ZIP)
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {rankedClassResults.map((row, i) => (
                    <div
                      key={row.id}
                      className="list-row section-enter"
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            flexShrink: 0,
                            background:
                              row.rank === 1
                                ? "#fbbf24"
                                : row.rank === 2
                                  ? "#94a3b8"
                                  : row.rank === 3
                                    ? "#d97706"
                                    : "var(--soft-btn-bg)",
                            color: row.rank <= 3 ? "#fff" : "var(--text-muted)",
                          }}
                        >
                          {row.rank}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)", margin: 0 }}>
                            {row.student.name}
                          </p>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                            {row.student.admissionNumber} &middot; {row.class.name}–
                            {row.student.section.name}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ textAlign: "right" }}>
                          <p
                            style={{
                              fontWeight: 700,
                              fontSize: "0.9rem",
                              color: "var(--primary)",
                              margin: 0,
                            }}
                          >
                            {row.percentage.toFixed(1)}%
                          </p>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                            {row.grandTotal}/{row.maxTotal}
                          </p>
                        </div>
                        <span className="badge">{row.grade}</span>
                        <button
                          className="btn btn-soft btn-sm"
                          onClick={() =>
                            void downloadBlob(
                              `/api/reports/${row.student.id}?format=pdf`,
                              "report-card.pdf",
                              `pdf-${row.student.id}`,
                            )
                          }
                          disabled={isBusy(`pdf-${row.student.id}`)}
                        >
                          {isBusy(`pdf-${row.student.id}`) ? (
                            <Spinner size={13} />
                          ) : (
                            <Icon d={ICONS.pdf} size={13} />
                          )}{" "}
                          PDF
                        </button>
                      </div>
                    </div>
                  ))}
                  {rankedClassResults.length === 0 && (
                    <div
                      style={{
                        padding: "2.5rem",
                        textAlign: "center",
                        color: "var(--text-muted)",
                        fontSize: "0.875rem",
                      }}
                    >
                      No results found. Select a class and ensure marks have been entered.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── REPORTS ─── */}
            {activeTab === "reports" && (
              <div className="section-enter">
                <SectionHeader
                  title="Report Cards"
                  subtitle="Generate PDF report cards for individual students"
                />

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {students.map((student, i) => (
                    <div
                      key={student.id}
                      className="list-row section-enter"
                      style={{ animationDelay: `${i * 0.025}s` }}
                    >
                      <div>
                        <p
                          style={{
                            fontWeight: 700,
                            fontSize: "0.875rem",
                            color: "var(--text)",
                            margin: 0,
                          }}
                        >
                          {student.name}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                          {student.admissionNumber} &middot; {student.class.name}–{student.section.name}
                        </p>
                      </div>
                      <button
                        className="btn btn-soft btn-sm"
                        onClick={() =>
                          void downloadBlob(
                            `/api/reports/${student.id}?format=pdf`,
                            "report-card.pdf",
                            `rep-${student.id}`,
                          )
                        }
                        disabled={isBusy(`rep-${student.id}`)}
                      >
                        {isBusy(`rep-${student.id}`) ? (
                          <Spinner size={13} />
                        ) : (
                          <Icon d={ICONS.pdf} size={13} />
                        )}
                        <span>Download PDF</span>
                      </button>
                    </div>
                  ))}
                  {students.length === 0 && (
                    <div
                      style={{
                        padding: "2.5rem",
                        textAlign: "center",
                        color: "var(--text-muted)",
                        fontSize: "0.875rem",
                      }}
                    >
                      No students found. Add students first.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── GRADING ─── */}
            {activeTab === "grading" && (
              <div className="section-enter">
                <SectionHeader
                  title="Grading Ranges"
                  subtitle="Define percentage ranges and corresponding letter grades"
                />
                <div className="card" style={{ padding: "1.5rem", maxWidth: 600 }}>
                  <form onSubmit={(e) => void saveGradeRanges(e)}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr 48px",
                        gap: "0.5rem",
                        padding: "0 0.25rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {["Min (%)", "Max (%)", "Grade", ""].map((h) => (
                        <span
                          key={h}
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {h}
                        </span>
                      ))}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        maxHeight: 380,
                        overflowY: "auto",
                      }}
                    >
                      {gradeRanges.map((item, index) => (
                        <div
                          key={`${item.id ?? "new"}-${index}`}
                          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 48px", gap: "0.5rem" }}
                        >
                          <input
                            className="input"
                            type="number"
                            min={0}
                            max={100}
                            value={item.min}
                            onChange={(e) =>
                              setGradeRanges((prev) =>
                                prev.map((r, idx) =>
                                  idx === index ? { ...r, min: Number(e.target.value) } : r,
                                ),
                              )
                            }
                          />
                          <input
                            className="input"
                            type="number"
                            min={0}
                            max={100}
                            value={item.max}
                            onChange={(e) =>
                              setGradeRanges((prev) =>
                                prev.map((r, idx) =>
                                  idx === index ? { ...r, max: Number(e.target.value) } : r,
                                ),
                              )
                            }
                          />
                          <input
                            className="input"
                            value={item.grade}
                            placeholder="A, B, C…"
                            onChange={(e) =>
                              setGradeRanges((prev) =>
                                prev.map((r, idx) =>
                                  idx === index ? { ...r, grade: e.target.value } : r,
                                ),
                              )
                            }
                          />
                          <button
                            className="btn btn-soft btn-icon"
                            type="button"
                            onClick={() =>
                              setGradeRanges((prev) => prev.filter((_, i) => i !== index))
                            }
                          >
                            <Icon d={ICONS.delete} size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "0.6rem",
                        marginTop: "1rem",
                        paddingTop: "0.75rem",
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      <button
                        className="btn btn-soft"
                        type="button"
                        onClick={() => setGradeRanges((prev) => [...prev, { min: 0, max: 0, grade: "" }])}
                      >
                        <Icon d={ICONS.plus} size={14} /> Add Range
                      </button>
                      <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={isBusy("saveGrading")}
                      >
                        {isBusy("saveGrading") ? (
                          <>
                            <Spinner size={14} /> Saving…
                          </>
                        ) : (
                          "Save Grading"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Confirm dialog */}
      {confirmDialog && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div className="card modal-box" style={{ width: "100%", maxWidth: 480, padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "#dc2626",
                }}
              >
                <Icon d={ICONS.warning} size={20} />
              </div>
              <div>
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    color: "var(--text)",
                    margin: "0 0 0.25rem",
                  }}
                >
                  {confirmDialog.title}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div
              style={{
                background: "#fef3c7",
                border: "1px solid #fcd34d",
                borderRadius: 10,
                padding: "0.85rem 1rem",
                marginBottom: "1.25rem",
              }}
            >
              <p
                style={{
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  color: "#92400e",
                  margin: "0 0 0.4rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Dependency Warnings
              </p>
              {confirmDialog.warnings.map((w) => (
                <p
                  key={w}
                  style={{
                    fontSize: "0.82rem",
                    color: "#78350f",
                    margin: "0.15rem 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <span style={{ color: "#d97706", flexShrink: 0 }}>⚠</span> {w}
                </p>
              ))}
            </div>

            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
              <button
                className="btn btn-soft"
                onClick={() => setConfirmDialog(null)}
                disabled={confirmBusy}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => void confirmDeleteAction()}
                disabled={confirmBusy}
              >
                {confirmBusy ? (
                  <>
                    <Spinner size={14} /> Working…
                  </>
                ) : (
                  confirmDialog.confirmLabel
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <ToastList toasts={toasts} dismiss={dismissToast} />

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          aside { transform: translateX(-100%); transition: transform 0.3s ease; }
          aside.open { transform: translateX(0) !important; }
          main { margin-left: 0 !important; }
          #mobileMenuBtn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
