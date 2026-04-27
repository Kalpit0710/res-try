"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

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

type GradeRangeItem = {
  id?: string;
  min: number;
  max: number;
  grade: string;
};

type ResultItem = {
  id: string;
  classId: string;
  grandTotal: number;
  maxTotal: number;
  percentage: number;
  grade: string;
  class: ClassItem;
  student: {
    id: string;
    admissionNumber: string;
    name: string;
    section: { name: string };
  };
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

type SectionEditState = {
  classId: string;
  name: string;
  classTeacherName: string;
};

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

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    data?: T;
    message?: string;
  };

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message ?? "Request failed");
  }

  return payload.data as T;
}

function toDateInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

export default function Home() {
  const [status, setStatus] = useState("Checking authentication...");
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("admin@school.local");
  const [password, setPassword] = useState("admin123");

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

  const [newClassName, setNewClassName] = useState("Grade 10");
  const [newSectionName, setNewSectionName] = useState("A");
  const [sectionClassId, setSectionClassId] = useState("");
  const [teacherName, setTeacherName] = useState("Class Teacher");
  const [newSubjectName, setNewSubjectName] = useState("Mathematics");
  const [mapClassId, setMapClassId] = useState("");
  const [mapSubjectId, setMapSubjectId] = useState("");

  const [studentForm, setStudentForm] = useState<StudentFormState>({
    admissionNumber: "ADM-001",
    name: "",
    classId: "",
    sectionId: "",
    dateOfBirth: "",
    parentName: "",
    contact: "",
  });

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [markRows, setMarkRows] = useState<MarkRow[]>([]);
  const [editingStudentId, setEditingStudentId] = useState("");
  const [editStudentForm, setEditStudentForm] = useState<StudentFormState | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [editingClassId, setEditingClassId] = useState("");
  const [editingClassName, setEditingClassName] = useState("");
  const [editingSectionId, setEditingSectionId] = useState("");
  const [editingSectionForm, setEditingSectionForm] = useState<SectionEditState | null>(null);
  const [editingSubjectId, setEditingSubjectId] = useState("");
  const [editingSubjectName, setEditingSubjectName] = useState("");
  const [gradeRanges, setGradeRanges] = useState<GradeRangeItem[]>([]);
  const [selectedResultsClassId, setSelectedResultsClassId] = useState("");
  const [classResults, setClassResults] = useState<ResultItem[]>([]);
  const [rankingSearchInput, setRankingSearchInput] = useState("");
  const [rankingSearch, setRankingSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const directoryPageSize = 10;
  const directoryTotalPages = Math.max(1, Math.ceil(studentDirectoryTotal / directoryPageSize));

  const loadAll = useCallback(async () => {
    const [classesData, sectionsData, subjectsData, studentPayload, dashboardData] = await Promise.all([
      api<ClassItem[]>("/api/classes"),
      api<SectionItem[]>("/api/sections"),
      api<SubjectItem[]>("/api/subjects"),
      api<{ students: StudentItem[] }>("/api/students?page=1&pageSize=300"),
      api<Record<string, number>>("/api/dashboard"),
    ]);

    setClasses(classesData);
    setSections(sectionsData);
    setSubjects(subjectsData);
    setStudents(studentPayload.students);
    setDashboard(dashboardData);

    if (classesData.length > 0) {
      setSectionClassId((prev) => prev || classesData[0].id);
      setMapClassId((prev) => prev || classesData[0].id);
      setSelectedResultsClassId((prev) => prev || classesData[0].id);
      setStudentForm((prev) => (prev.classId ? prev : { ...prev, classId: classesData[0].id }));
    }

    if (subjectsData.length > 0) {
      setMapSubjectId((prev) => prev || subjectsData[0].id);
    }

    return classesData[0]?.id;
  }, []);

  const loadGradeRanges = useCallback(async () => {
    const ranges = await api<GradeRangeItem[]>("/api/grading");
    setGradeRanges(ranges);
  }, []);

  const loadClassResults = useCallback(
    async (classIdOverride?: string) => {
      const classId = classIdOverride ?? selectedResultsClassId;
      if (!classId) {
        setClassResults([]);
        return;
      }

      const rows = await api<ResultItem[]>(`/api/results?classId=${encodeURIComponent(classId)}`);
      setClassResults(rows);
    },
    [selectedResultsClassId],
  );

  const loadStudentDirectory = useCallback(
    async (overrides?: { page?: number; query?: string; classId?: string }) => {
      const activePage = overrides?.page ?? studentDirectoryPage;
      const activeQuery = overrides?.query ?? studentDirectoryQuery;
      const activeClassId = overrides?.classId ?? studentDirectoryClassId;

      const params = new URLSearchParams({
        page: String(activePage),
        pageSize: String(directoryPageSize),
      });

      if (activeQuery.trim()) params.set("q", activeQuery.trim());
      if (activeClassId) params.set("classId", activeClassId);

      const payload = await api<{ total: number; students: StudentItem[] }>(`/api/students?${params.toString()}`);
      setStudentDirectory(payload.students);
      setStudentDirectoryTotal(payload.total);
    },
    [studentDirectoryClassId, studentDirectoryPage, studentDirectoryQuery],
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await api("/api/auth/me");
        if (!mounted) return;

        setLoggedIn(true);
        setStatus("Authenticated");
        const firstClassId = await loadAll();
        await loadStudentDirectory({ page: 1 });
        await loadGradeRanges();
        await loadClassResults(firstClassId);
      } catch {
        if (!mounted) return;

        setLoggedIn(false);
        setStatus("Login required");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadAll, loadClassResults, loadGradeRanges, loadStudentDirectory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStudentDirectoryQuery(studentDirectorySearchInput);
      setStudentDirectoryPage(1);
      if (!loggedIn) return;
      void loadStudentDirectory({ page: 1, query: studentDirectorySearchInput });
    }, 400);

    return () => clearTimeout(timer);
  }, [loggedIn, loadStudentDirectory, studentDirectorySearchInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRankingSearch(rankingSearchInput);
    }, 400);

    return () => clearTimeout(timer);
  }, [rankingSearchInput]);

  const rankedClassResults = useMemo(
    () =>
      [...classResults]
        .sort((a, b) => b.percentage - a.percentage || b.grandTotal - a.grandTotal || a.student.name.localeCompare(b.student.name))
        .filter((item) => {
          if (!rankingSearch.trim()) return true;
          const q = rankingSearch.trim().toLowerCase();
          return (
            item.student.name.toLowerCase().includes(q) ||
            item.student.admissionNumber.toLowerCase().includes(q) ||
            item.student.section.name.toLowerCase().includes(q)
          );
        })
        .map((item, index) => ({ ...item, rank: index + 1 })),
    [classResults, rankingSearch],
  );

  const sectionOptions = useMemo(
    () => sections.filter((section) => section.classId === studentForm.classId),
    [sections, studentForm.classId],
  );

  const editSectionOptions = useMemo(
    () => sections.filter((section) => section.classId === (editStudentForm?.classId ?? "")),
    [editStudentForm?.classId, sections],
  );

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setLoggedIn(true);
      setStatus("Authenticated");
      const firstClassId = await loadAll();
      await loadStudentDirectory({ page: 1 });
      await loadGradeRanges();
      await loadClassResults(firstClassId);
    } catch (error) {
      setStatus(String(error));
    }
  }

  async function handleInitialize() {
    try {
      await api("/api/setup/seed", { method: "POST", body: JSON.stringify({}) });
      setStatus("System initialized with default admin and grade ranges");
    } catch (error) {
      setStatus(String(error));
    }
  }

  async function handleCreateClass(event: FormEvent) {
    event.preventDefault();
    await api("/api/classes", { method: "POST", body: JSON.stringify({ name: newClassName }) });
    setNewClassName("");
    const firstClassId = await loadAll();
    await loadClassResults(firstClassId);
  }

  async function handleCreateSection(event: FormEvent) {
    event.preventDefault();
    await api("/api/sections", {
      method: "POST",
      body: JSON.stringify({ classId: sectionClassId, name: newSectionName, classTeacherName: teacherName }),
    });
    setNewSectionName("");
    await loadAll();
    await loadClassResults();
  }

  async function handleCreateSubject(event: FormEvent) {
    event.preventDefault();
    await api("/api/subjects", { method: "POST", body: JSON.stringify({ name: newSubjectName }) });
    setNewSubjectName("");
    await loadAll();
  }

  function startClassEdit(item: ClassItem) {
    setEditingClassId(item.id);
    setEditingClassName(item.name);
  }

  async function saveClassEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingClassId) return;

    await api(`/api/classes/${editingClassId}`, {
      method: "PUT",
      body: JSON.stringify({ name: editingClassName }),
    });

    setEditingClassId("");
    setEditingClassName("");
    setStatus("Class updated");
    const firstClassId = await loadAll();
    await loadClassResults(firstClassId);
  }

  async function getDeleteImpact(entity: DeleteImpactResponse["entity"], id: string) {
    return api<DeleteImpactResponse>(`/api/delete-impact?entity=${encodeURIComponent(entity)}&id=${encodeURIComponent(id)}`);
  }

  function openDeleteDialog(config: ConfirmDialogState) {
    setConfirmDialog(config);
  }

  async function confirmDeleteAction() {
    if (!confirmDialog) return;

    try {
      setConfirmBusy(true);
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } catch (error) {
      setStatus(String(error));
    } finally {
      setConfirmBusy(false);
    }
  }

  async function deleteClass(id: string) {
    await api(`/api/classes/${id}`, { method: "DELETE" });
    setStatus("Class deleted");
    const firstClassId = await loadAll();
    await loadClassResults(firstClassId);
  }

  async function confirmDeleteClass(id: string) {
    const impact = await getDeleteImpact("class", id);
    openDeleteDialog({
      title: `Delete Class: ${impact.name}`,
      message: "Deleting this class can cascade to related academic structure records.",
      warnings: [
        `${impact.counts.sections} sections belong to this class`,
        `${impact.counts.students} students are assigned to this class`,
        `${impact.counts.classSubjects} class-subject mappings are attached`,
        `${impact.counts.results} computed result rows are linked`,
      ],
      confirmLabel: "Delete Class",
      onConfirm: async () => deleteClass(id),
    });
  }

  function startSectionEdit(item: SectionItem) {
    setEditingSectionId(item.id);
    setEditingSectionForm({
      classId: item.classId,
      name: item.name,
      classTeacherName: item.classTeacherName,
    });
  }

  async function saveSectionEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingSectionId || !editingSectionForm) return;

    await api(`/api/sections/${editingSectionId}`, {
      method: "PUT",
      body: JSON.stringify(editingSectionForm),
    });

    setEditingSectionId("");
    setEditingSectionForm(null);
    setStatus("Section updated");
    await loadAll();
    await loadClassResults();
  }

  async function deleteSection(id: string) {
    await api(`/api/sections/${id}`, { method: "DELETE" });
    setStatus("Section deleted");
    await loadAll();
    await loadClassResults();
  }

  async function confirmDeleteSection(id: string) {
    const impact = await getDeleteImpact("section", id);
    openDeleteDialog({
      title: `Delete Section: ${impact.name}`,
      message: "Sections cannot be removed safely while students are still assigned.",
      warnings: [`${impact.counts.students} students are currently in this section`],
      confirmLabel: "Delete Section",
      onConfirm: async () => deleteSection(id),
    });
  }

  function startSubjectEdit(item: SubjectItem) {
    setEditingSubjectId(item.id);
    setEditingSubjectName(item.name);
  }

  async function saveSubjectEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingSubjectId) return;

    await api(`/api/subjects/${editingSubjectId}`, {
      method: "PUT",
      body: JSON.stringify({ name: editingSubjectName }),
    });

    setEditingSubjectId("");
    setEditingSubjectName("");
    setStatus("Subject updated");
    await loadAll();
  }

  async function deleteSubject(id: string) {
    await api(`/api/subjects/${id}`, { method: "DELETE" });
    setStatus("Subject deleted");
    await loadAll();
  }

  async function confirmDeleteSubject(id: string) {
    const impact = await getDeleteImpact("subject", id);
    openDeleteDialog({
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

  async function handleMapSubject(event: FormEvent) {
    event.preventDefault();
    await api("/api/class-subjects", {
      method: "POST",
      body: JSON.stringify({ classId: mapClassId, subjectId: mapSubjectId }),
    });
    setStatus("Subject mapped to class");
  }

  async function handleCreateStudent(event: FormEvent) {
    event.preventDefault();
    await api("/api/students", {
      method: "POST",
      body: JSON.stringify(studentForm),
    });
    setStudentForm((prev) => ({ ...prev, name: "", parentName: "", contact: "", dateOfBirth: "" }));
    await loadAll();
    await loadStudentDirectory();
  }

  function startEditStudent(student: StudentItem) {
    setEditingStudentId(student.id);
    setEditStudentForm({
      admissionNumber: student.admissionNumber,
      name: student.name,
      classId: student.classId,
      sectionId: student.sectionId,
      dateOfBirth: toDateInput(student.dateOfBirth),
      parentName: student.parentName ?? "",
      contact: student.contact ?? "",
    });
  }

  async function saveEditedStudent(event: FormEvent) {
    event.preventDefault();
    if (!editingStudentId || !editStudentForm) return;

    await api(`/api/students/${editingStudentId}`, {
      method: "PUT",
      body: JSON.stringify(editStudentForm),
    });

    setStatus("Student updated");
    setEditingStudentId("");
    setEditStudentForm(null);
    await loadAll();
    await loadStudentDirectory();
  }

  async function deleteStudent(studentId: string) {
    await api(`/api/students/${studentId}`, { method: "DELETE" });
    setStatus("Student deleted");
    await loadAll();
    await loadStudentDirectory();
  }

  async function confirmDeleteStudent(studentId: string) {
    const impact = await getDeleteImpact("student", studentId);
    openDeleteDialog({
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
    setSelectedStudentId(studentId);
    const data = await api<{ rows: MarkRow[] }>(`/api/marks/${studentId}`);
    setMarkRows(data.rows);
  }

  async function saveMarks() {
    if (!selectedStudentId) return;
    await api(`/api/marks/${selectedStudentId}`, {
      method: "PUT",
      body: JSON.stringify({
        marks: markRows.map((row) => ({
          subjectId: row.subjectId,
          halfYearlyMarks: Number(row.halfYearlyMarks),
          finalTermMarks: Number(row.finalTermMarks),
        })),
      }),
    });
    setStatus("Marks saved and result recalculated");
  }

  async function handleLogout() {
    await api("/api/auth/logout", { method: "POST" });
    setLoggedIn(false);
    setStatus("Logged out");
  }

  async function downloadStudentsExcel() {
    const response = await fetch("/api/students/export");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadResultsExcel() {
    const response = await fetch("/api/results?format=excel");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "results.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importStudentsExcel() {
    if (!importFile) {
      setStatus("Select an .xlsx file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);

    const response = await fetch("/api/students/import", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      message?: string;
      data?: { importedCount: number; duplicateCount: number };
    };

    if (!response.ok || payload.success === false) {
      setStatus(payload.message ?? "Import failed");
      return;
    }

    const importedCount = payload.data?.importedCount ?? 0;
    const duplicateCount = payload.data?.duplicateCount ?? 0;
    setStatus(`Import complete: ${importedCount} added, ${duplicateCount} skipped as duplicates`);
    setImportFile(null);
    await loadAll();
    await loadStudentDirectory();
  }

  async function saveGradeRanges(event: FormEvent) {
    event.preventDefault();

    await api("/api/grading", {
      method: "PUT",
      body: JSON.stringify({
        ranges: gradeRanges.map((item) => ({
          min: Number(item.min),
          max: Number(item.max),
          grade: item.grade,
        })),
      }),
    });

    setStatus("Grading ranges updated");
    await loadGradeRanges();
    await loadClassResults();
  }

  function addGradeRangeRow() {
    setGradeRanges((prev) => [...prev, { min: 0, max: 0, grade: "" }]);
  }

  function removeGradeRangeRow(index: number) {
    setGradeRanges((prev) => prev.filter((_, i) => i !== index));
  }

  async function downloadClassResultsExcel() {
    if (!selectedResultsClassId) {
      setStatus("Select a class first");
      return;
    }

    const response = await fetch(`/api/results?format=excel&classId=${encodeURIComponent(selectedResultsClassId)}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "class-results.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadClassReportsZip() {
    if (!selectedResultsClassId) {
      setStatus("Select a class first");
      return;
    }

    const response = await fetch(`/api/reports/class/${selectedResultsClassId}`);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      setStatus(payload.message ?? "Could not generate class report ZIP");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "class-report-cards.zip";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadReportPdf(studentId: string) {
    const response = await fetch(`/api/reports/${studentId}?format=pdf`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "report-card.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!loggedIn) {
    return (
      <main className="w-full max-w-md mx-auto mt-20 p-6 card">
        <h1 className="text-2xl font-bold mb-2">School Result Management</h1>
        <p className="mb-4 text-sm text-slate-600">{status}</p>
        <form className="space-y-3" onSubmit={handleLogin}>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin email" />
          <input
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
          />
          <div className="flex gap-2">
            <button className="btn btn-primary" type="submit">
              Login
            </button>
            <button className="btn btn-soft" type="button" onClick={handleInitialize}>
              Initialize
            </button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-5">
      <header className="card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">School Result Management System</h1>
            <p className="text-slate-700">GUID-backed records, admission-based search, marks entry, and report generation</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-soft" type="button" onClick={downloadResultsExcel}>
              Export Results
            </button>
            <button className="btn btn-soft" type="button" onClick={downloadStudentsExcel}>
              Export Students
            </button>
            <button className="btn btn-soft" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-700">{status}</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(dashboard).map(([label, value]) => (
          <article key={label} className="card p-3">
            <p className="text-xs uppercase text-slate-500">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <article className="card p-4 space-y-3">
          <h2 className="text-xl font-bold">Class and Section</h2>
          <form className="space-y-2" onSubmit={handleCreateClass}>
            <input className="input" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="Class name" />
            <button className="btn btn-primary" type="submit">
              Add Class
            </button>
          </form>
          <form className="space-y-2" onSubmit={handleCreateSection}>
            <select className="input" value={sectionClassId} onChange={(e) => setSectionClassId(e.target.value)}>
              <option value="">Select class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <input className="input" value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} placeholder="Section" />
            <input className="input" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} placeholder="Class teacher name" />
            <button className="btn btn-primary" type="submit">
              Add Section
            </button>
          </form>
        </article>

        <article className="card p-4 space-y-3">
          <h2 className="text-xl font-bold">Subjects and Mapping</h2>
          <form className="space-y-2" onSubmit={handleCreateSubject}>
            <input className="input" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="Subject" />
            <button className="btn btn-primary" type="submit">
              Add Subject
            </button>
          </form>
          <form className="space-y-2" onSubmit={handleMapSubject}>
            <select className="input" value={mapClassId} onChange={(e) => setMapClassId(e.target.value)}>
              <option value="">Class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select className="input" value={mapSubjectId} onChange={(e) => setMapSubjectId(e.target.value)}>
              <option value="">Subject</option>
              {subjects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <button className="btn btn-primary" type="submit">
              Map Subject To Class
            </button>
          </form>
        </article>

        <article className="card p-4 space-y-3">
          <h2 className="text-xl font-bold">Student Management</h2>
          <form className="space-y-2" onSubmit={handleCreateStudent}>
            <input
              className="input"
              value={studentForm.admissionNumber}
              onChange={(e) => setStudentForm((prev) => ({ ...prev, admissionNumber: e.target.value }))}
              placeholder="Admission number"
            />
            <input
              className="input"
              value={studentForm.name}
              onChange={(e) => setStudentForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Student name"
            />
            <select
              className="input"
              value={studentForm.classId}
              onChange={(e) => setStudentForm((prev) => ({ ...prev, classId: e.target.value, sectionId: "" }))}
            >
              <option value="">Class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={studentForm.sectionId}
              onChange={(e) => setStudentForm((prev) => ({ ...prev, sectionId: e.target.value }))}
            >
              <option value="">Section</option>
              {sectionOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="date"
              value={studentForm.dateOfBirth}
              onChange={(e) => setStudentForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
            />
            <input
              className="input"
              value={studentForm.parentName}
              onChange={(e) => setStudentForm((prev) => ({ ...prev, parentName: e.target.value }))}
              placeholder="Parent name"
            />
            <input
              className="input"
              value={studentForm.contact}
              onChange={(e) => setStudentForm((prev) => ({ ...prev, contact: e.target.value }))}
              placeholder="Contact"
            />
            <button className="btn btn-primary" type="submit">
              Add Student
            </button>
          </form>

          <div className="pt-2 border-t border-slate-200 space-y-2">
            <p className="font-semibold">Import Students (Excel)</p>
            <input
              className="input"
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            />
            <button className="btn btn-soft" type="button" onClick={() => void importStudentsExcel()}>
              Upload Import File
            </button>
          </div>
        </article>
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <article className="card p-4 space-y-3">
          <h2 className="text-xl font-bold">Manage Classes</h2>
          <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
            {classes.map((item) => (
              <div key={item.id} className="p-2 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-2">
                <p className="font-semibold">{item.name}</p>
                <div className="flex gap-2">
                  <button className="btn btn-soft" type="button" onClick={() => startClassEdit(item)}>
                    Edit
                  </button>
                  <button className="btn btn-soft" type="button" onClick={() => void confirmDeleteClass(item.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {editingClassId && (
            <form className="space-y-2 p-2 rounded-lg border border-slate-200 bg-white" onSubmit={saveClassEdit}>
              <input className="input" value={editingClassName} onChange={(e) => setEditingClassName(e.target.value)} />
              <div className="flex gap-2">
                <button className="btn btn-primary" type="submit">
                  Save
                </button>
                <button
                  className="btn btn-soft"
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
          )}
        </article>

        <article className="card p-4 space-y-3">
          <h2 className="text-xl font-bold">Manage Sections</h2>
          <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
            {sections.map((item) => (
              <div key={item.id} className="p-2 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {item.class.name} - {item.name}
                  </p>
                  <p className="text-sm text-slate-600">Teacher: {item.classTeacherName || "-"}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-soft" type="button" onClick={() => startSectionEdit(item)}>
                    Edit
                  </button>
                  <button className="btn btn-soft" type="button" onClick={() => void confirmDeleteSection(item.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {editingSectionId && editingSectionForm && (
            <form className="space-y-2 p-2 rounded-lg border border-slate-200 bg-white" onSubmit={saveSectionEdit}>
              <select
                className="input"
                value={editingSectionForm.classId}
                onChange={(e) =>
                  setEditingSectionForm((prev) => (prev ? { ...prev, classId: e.target.value } : prev))
                }
              >
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <input
                className="input"
                value={editingSectionForm.name}
                onChange={(e) => setEditingSectionForm((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                placeholder="Section name"
              />
              <input
                className="input"
                value={editingSectionForm.classTeacherName}
                onChange={(e) =>
                  setEditingSectionForm((prev) => (prev ? { ...prev, classTeacherName: e.target.value } : prev))
                }
                placeholder="Teacher name"
              />
              <div className="flex gap-2">
                <button className="btn btn-primary" type="submit">
                  Save
                </button>
                <button
                  className="btn btn-soft"
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
          )}
        </article>

        <article className="card p-4 space-y-3">
          <h2 className="text-xl font-bold">Manage Subjects</h2>
          <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
            {subjects.map((item) => (
              <div key={item.id} className="p-2 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-2">
                <p className="font-semibold">{item.name}</p>
                <div className="flex gap-2">
                  <button className="btn btn-soft" type="button" onClick={() => startSubjectEdit(item)}>
                    Edit
                  </button>
                  <button className="btn btn-soft" type="button" onClick={() => void confirmDeleteSubject(item.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {editingSubjectId && (
            <form className="space-y-2 p-2 rounded-lg border border-slate-200 bg-white" onSubmit={saveSubjectEdit}>
              <input className="input" value={editingSubjectName} onChange={(e) => setEditingSubjectName(e.target.value)} />
              <div className="flex gap-2">
                <button className="btn btn-primary" type="submit">
                  Save
                </button>
                <button
                  className="btn btn-soft"
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
          )}
        </article>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <article className="card p-4 space-y-3">
          <h2 className="text-xl font-bold">Grading Ranges</h2>
          <form className="space-y-2" onSubmit={saveGradeRanges}>
            <div className="space-y-2 max-h-[280px] overflow-auto pr-1">
              {gradeRanges.map((item, index) => (
                <div key={`${item.id ?? "new"}-${index}`} className="grid grid-cols-4 gap-2 items-center">
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={100}
                    value={item.min}
                    onChange={(e) =>
                      setGradeRanges((prev) =>
                        prev.map((row, idx) => (idx === index ? { ...row, min: Number(e.target.value) } : row)),
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
                        prev.map((row, idx) => (idx === index ? { ...row, max: Number(e.target.value) } : row)),
                      )
                    }
                  />
                  <input
                    className="input"
                    value={item.grade}
                    onChange={(e) =>
                      setGradeRanges((prev) =>
                        prev.map((row, idx) => (idx === index ? { ...row, grade: e.target.value } : row)),
                      )
                    }
                    placeholder="Grade"
                  />
                  <button className="btn btn-soft" type="button" onClick={() => removeGradeRangeRow(index)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="btn btn-soft" type="button" onClick={addGradeRangeRow}>
                Add Range
              </button>
              <button className="btn btn-primary" type="submit">
                Save Grading
              </button>
            </div>
          </form>
        </article>

        <article className="card p-4 space-y-3">
          <h2 className="text-xl font-bold">Class-wise Results and Ranking</h2>
          <div className="grid md:grid-cols-2 gap-2">
            <select
              className="input"
              value={selectedResultsClassId}
              onChange={(e) => {
                const classId = e.target.value;
                setSelectedResultsClassId(classId);
                void loadClassResults(classId);
              }}
            >
              <option value="">Select class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <button className="btn btn-soft" type="button" onClick={() => void loadClassResults()}>
              Refresh Ranking
            </button>
            <input
              className="input md:col-span-2"
              placeholder="Search ranked students by name, admission no, or section"
              value={rankingSearchInput}
              onChange={(e) => setRankingSearchInput(e.target.value)}
            />
            <button className="btn btn-soft" type="button" onClick={() => void downloadClassResultsExcel()}>
              Export Class Excel
            </button>
            <button className="btn btn-soft" type="button" onClick={() => void downloadClassReportsZip()}>
              Download All PDFs (ZIP)
            </button>
          </div>

          <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
            {rankedClassResults.map((row) => (
              <div key={row.id} className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    #{row.rank} {row.student.name}
                  </p>
                  <p className="text-sm text-slate-600">
                    {row.student.admissionNumber} | {row.class.name}-{row.student.section.name}
                  </p>
                  <p className="text-sm text-slate-600">
                    Total: {row.grandTotal}/{row.maxTotal} | {row.percentage.toFixed(2)}% | Grade {row.grade}
                  </p>
                </div>
                <button className="btn btn-soft" type="button" onClick={() => void downloadReportPdf(row.student.id)}>
                  PDF
                </button>
              </div>
            ))}
            {rankedClassResults.length === 0 && (
              <p className="text-sm text-slate-600">No results found for this class. Enter marks and refresh ranking.</p>
            )}
          </div>
        </article>
      </section>

      <section className="card p-4 space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-bold">Student Directory</h2>
          <p className="text-sm text-slate-600">Search, filter, edit, and delete student records</p>
        </div>

        <div className="grid md:grid-cols-3 gap-2">
          <input
            className="input"
            placeholder="Search by admission number or name"
            value={studentDirectorySearchInput}
            onChange={(e) => setStudentDirectorySearchInput(e.target.value)}
          />
          <select
            className="input"
            value={studentDirectoryClassId}
            onChange={(e) => {
              const classId = e.target.value;
              setStudentDirectoryClassId(classId);
              setStudentDirectoryPage(1);
              void loadStudentDirectory({ page: 1, classId, query: studentDirectorySearchInput });
            }}
          >
            <option value="">All classes</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-soft"
            type="button"
            onClick={() =>
              void loadStudentDirectory({ page: studentDirectoryPage, classId: studentDirectoryClassId, query: studentDirectoryQuery })
            }
          >
            Refresh
          </button>
        </div>

        <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
          {studentDirectory.map((student) => (
            <div key={student.id} className="p-3 rounded-lg border border-slate-200 bg-white flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{student.name}</p>
                <p className="text-sm text-slate-600">
                  {student.admissionNumber} | {student.class.name}-{student.section.name}
                </p>
                <p className="text-sm text-slate-600">
                  Parent: {student.parentName ?? "-"} | Contact: {student.contact ?? "-"}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-soft" type="button" onClick={() => startEditStudent(student)}>
                  Edit
                </button>
                <button className="btn btn-soft" type="button" onClick={() => void confirmDeleteStudent(student.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          {studentDirectory.length === 0 && <p className="text-sm text-slate-600">No students found for current filters.</p>}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Page {studentDirectoryPage} of {directoryTotalPages} ({studentDirectoryTotal} students)
          </p>
          <div className="flex gap-2">
            <button
              className="btn btn-soft"
              type="button"
              onClick={() => {
                const nextPage = Math.max(1, studentDirectoryPage - 1);
                setStudentDirectoryPage(nextPage);
                void loadStudentDirectory({ page: nextPage, classId: studentDirectoryClassId, query: studentDirectoryQuery });
              }}
              disabled={studentDirectoryPage <= 1}
            >
              Previous
            </button>
            <button
              className="btn btn-soft"
              type="button"
              onClick={() => {
                const nextPage = Math.min(directoryTotalPages, studentDirectoryPage + 1);
                setStudentDirectoryPage(nextPage);
                void loadStudentDirectory({ page: nextPage, classId: studentDirectoryClassId, query: studentDirectoryQuery });
              }}
              disabled={studentDirectoryPage >= directoryTotalPages}
            >
              Next
            </button>
          </div>
        </div>

        {editingStudentId && editStudentForm && (
          <form className="space-y-2 p-3 rounded-lg border border-slate-200 bg-white" onSubmit={saveEditedStudent}>
            <p className="font-semibold">Edit Student</p>
            <input className="input" value={editStudentForm.admissionNumber} disabled />
            <input
              className="input"
              value={editStudentForm.name}
              onChange={(e) => setEditStudentForm((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
              placeholder="Student name"
            />
            <select
              className="input"
              value={editStudentForm.classId}
              onChange={(e) =>
                setEditStudentForm((prev) => (prev ? { ...prev, classId: e.target.value, sectionId: "" } : prev))
              }
            >
              <option value="">Class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={editStudentForm.sectionId}
              onChange={(e) => setEditStudentForm((prev) => (prev ? { ...prev, sectionId: e.target.value } : prev))}
            >
              <option value="">Section</option>
              {editSectionOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="date"
              value={editStudentForm.dateOfBirth}
              onChange={(e) => setEditStudentForm((prev) => (prev ? { ...prev, dateOfBirth: e.target.value } : prev))}
            />
            <input
              className="input"
              value={editStudentForm.parentName}
              onChange={(e) => setEditStudentForm((prev) => (prev ? { ...prev, parentName: e.target.value } : prev))}
              placeholder="Parent name"
            />
            <input
              className="input"
              value={editStudentForm.contact}
              onChange={(e) => setEditStudentForm((prev) => (prev ? { ...prev, contact: e.target.value } : prev))}
              placeholder="Contact"
            />
            <div className="flex gap-2">
              <button className="btn btn-primary" type="submit">
                Save Changes
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
        )}
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <article className="card p-4 space-y-3">
          <h2 className="text-xl font-bold">Marks Entry</h2>
          <select className="input" value={selectedStudentId} onChange={(e) => void loadStudentMarks(e.target.value)}>
            <option value="">Select student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.admissionNumber} - {student.name} ({student.class.name}-{student.section.name})
              </option>
            ))}
          </select>
          <div className="space-y-2">
            {markRows.map((row, index) => (
              <div key={row.subjectId} className="grid grid-cols-4 gap-2 items-center">
                <p className="font-semibold">{row.subjectName}</p>
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
                        idx === index
                          ? { ...item, halfYearlyMarks: half, totalMarks: Number((half + item.finalTermMarks).toFixed(2)) }
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
                        idx === index
                          ? { ...item, finalTermMarks: final, totalMarks: Number((item.halfYearlyMarks + final).toFixed(2)) }
                          : item,
                      ),
                    );
                  }}
                />
                <p className="font-bold text-center">{row.totalMarks}</p>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" type="button" onClick={() => void saveMarks()}>
            Save Marks
          </button>
        </article>

        <article className="card p-4 space-y-3">
          <h2 className="text-xl font-bold">Report Cards</h2>
          <p className="text-slate-700">Generate PDF report cards with half-yearly, final term, totals, percentage, and grade.</p>
          <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
            {students.map((student) => (
              <div key={student.id} className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{student.name}</p>
                  <p className="text-sm text-slate-600">
                    {student.admissionNumber} | {student.class.name}-{student.section.name}
                  </p>
                </div>
                <button className="btn btn-soft" type="button" onClick={() => void downloadReportPdf(student.id)}>
                  PDF
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>

      {confirmDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-xl p-5 space-y-4">
            <div>
              <h3 className="text-2xl font-bold">{confirmDialog.title}</h3>
              <p className="text-slate-700 mt-1">{confirmDialog.message}</p>
            </div>

            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-1">
              <p className="font-semibold text-amber-900">Dependency warnings</p>
              {confirmDialog.warnings.map((item) => (
                <p key={item} className="text-sm text-amber-900">
                  - {item}
                </p>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button className="btn btn-soft" type="button" onClick={() => setConfirmDialog(null)} disabled={confirmBusy}>
                Cancel
              </button>
              <button className="btn btn-primary" type="button" onClick={() => void confirmDeleteAction()} disabled={confirmBusy}>
                {confirmBusy ? "Working..." : confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
