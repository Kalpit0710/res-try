"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type ClassItem = { id: string; name: string };
type SectionItem = { id: string; name: string; classId: string; classTeacherName: string; class: ClassItem };
type SubjectItem = { id: string; name: string };
type StudentItem = {
  id: string;
  admissionNumber: string;
  name: string;
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

export default function Home() {
  const [status, setStatus] = useState("Checking authentication...");
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("admin@school.local");
  const [password, setPassword] = useState("admin123");

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [dashboard, setDashboard] = useState<Record<string, number>>({});

  const [newClassName, setNewClassName] = useState("Grade 10");
  const [newSectionName, setNewSectionName] = useState("A");
  const [sectionClassId, setSectionClassId] = useState("");
  const [teacherName, setTeacherName] = useState("Class Teacher");
  const [newSubjectName, setNewSubjectName] = useState("Mathematics");
  const [mapClassId, setMapClassId] = useState("");
  const [mapSubjectId, setMapSubjectId] = useState("");

  const [studentForm, setStudentForm] = useState({
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

  const loadAll = useCallback(async () => {
    const [classesData, sectionsData, subjectsData, studentPayload, dashboardData] = await Promise.all([
      api<ClassItem[]>("/api/classes"),
      api<SectionItem[]>("/api/sections"),
      api<SubjectItem[]>("/api/subjects"),
      api<{ students: StudentItem[] }>("/api/students?page=1&pageSize=100"),
      api<Record<string, number>>("/api/dashboard"),
    ]);

    setClasses(classesData);
    setSections(sectionsData);
    setSubjects(subjectsData);
    setStudents(studentPayload.students);
    setDashboard(dashboardData);

    if (!sectionClassId && classesData[0]) setSectionClassId(classesData[0].id);
    if (!mapClassId && classesData[0]) setMapClassId(classesData[0].id);
    if (!mapSubjectId && subjectsData[0]) setMapSubjectId(subjectsData[0].id);
  }, [mapClassId, mapSubjectId, sectionClassId]);

  useEffect(() => {
    (async () => {
      try {
        await api("/api/auth/me");
        setLoggedIn(true);
        setStatus("Authenticated");
        await loadAll();
      } catch {
        setLoggedIn(false);
        setStatus("Login required");
      }
    })();
  }, [loadAll]);

  const sectionOptions = useMemo(
    () => sections.filter((section) => section.classId === studentForm.classId),
    [sections, studentForm.classId],
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
      await loadAll();
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
    await loadAll();
  }

  async function handleCreateSection(event: FormEvent) {
    event.preventDefault();
    await api("/api/sections", {
      method: "POST",
      body: JSON.stringify({ classId: sectionClassId, name: newSectionName, classTeacherName: teacherName }),
    });
    setNewSectionName("");
    await loadAll();
  }

  async function handleCreateSubject(event: FormEvent) {
    event.preventDefault();
    await api("/api/subjects", { method: "POST", body: JSON.stringify({ name: newSubjectName }) });
    setNewSubjectName("");
    await loadAll();
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
        </article>
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
    </main>
  );
}
