import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../lib/clientApi';
import { AdminMarksExcelBulk } from '../components/AdminMarksExcelBulk';

// Co-scholastic areas (static) - module scope to keep stable reference
const CO_SCHOLASTIC_AREAS = ['Work Education', 'Art Education', 'Health & Physical Education', 'Discipline'];

function isObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}

function extractClassId(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object') return '';

  const candidate = value as Record<string, unknown>;
  const nested = candidate._id ?? candidate.id;
  if (typeof nested === 'string') return nested;

  if (nested && typeof nested === 'object') {
    const nestedObj = nested as Record<string, unknown>;
    if (typeof nestedObj.$oid === 'string') return nestedObj.$oid;
  }

  if (typeof candidate.$oid === 'string') return candidate.$oid;
  return '';
}

interface TermMarks {
  periodicTest?: number | '';
  notebook?: number | '';
  subEnrichment?: number | '';
  halfYearlyExam?: number | '';
  yearlyExam?: number | '';
}

interface SubjectMarksState {
  subjectId: string;
  subjectName: string;
  maxMarks: {
    term1: { periodicTest: number; notebook: number; subEnrichment: number; halfYearlyExam: number };
    term2: { periodicTest: number; notebook: number; subEnrichment: number; yearlyExam: number };
  };
  existingId?: string;
  term1: TermMarks;
  term2: TermMarks;
  saving: boolean;
  saved: boolean;
  error: string | null;
}

interface CoScholasticMarksState {
  area: string;
  existingId?: string;
  term1: number | '';
  term2: number | '';
  saving: boolean;
  saved: boolean;
  error: string | null;
}

function numOrEmpty(v: number | undefined): number | '' {
  return v === undefined || v === null ? '' : v;
}

export function MarksEntryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [studentId, setStudentId] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teacherName, setTeacherName] = useState('');
  const [subjectStates, setSubjectStates] = useState<SubjectMarksState[]>([]);
  const [coScholasticStates, setCoScholasticStates] = useState<CoScholasticMarksState[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [queryBootstrapDone, setQueryBootstrapDone] = useState(false);
  const [initialStudentApplied, setInitialStudentApplied] = useState(false);
  const isAdminMode = location.pathname.startsWith('/admin/');

  interface RemarkState {
    text: string;
    teacherName?: string;
    saving: boolean;
    saved: boolean;
    error: string | null;
  }
  const [remarkState, setRemarkState] = useState<RemarkState>({ text: '', teacherName: '', saving: false, saved: false, error: null });
  const initialTeacherName = searchParams.get('teacherName') ?? '';
  const initialClassId = searchParams.get('classId') ?? '';
  const initialStudentId = searchParams.get('studentId') ?? '';

  // Co-scholastic areas (static) - moved outside component to avoid new reference each render

  // Load classes on mount
  useEffect(() => {
    Promise.all([apiClient.publicGetClasses(), apiClient.publicGetTeachers()]).then(([classesRes, teachersRes]) => {
      setClasses(classesRes.data ?? classesRes);
      setTeachers(teachersRes.data ?? teachersRes);
    });
  }, []);

  useEffect(() => {
    if (queryBootstrapDone) return;

    if (initialTeacherName) setTeacherName(initialTeacherName);

    if (initialClassId && isObjectId(initialClassId)) {
      setClassId(initialClassId);
      setQueryBootstrapDone(true);
      return;
    }

    if (initialStudentId) {
      apiClient
        .publicGetStudents()
        .then((res) => {
          const all: any[] = res.data ?? res ?? [];
          const initialStudent = all.find((s) => s._id === initialStudentId);
          const derivedClassId = extractClassId(initialStudent?.classId);
          if (derivedClassId && isObjectId(derivedClassId)) {
            setClassId(derivedClassId);
          }
        })
        .finally(() => setQueryBootstrapDone(true));
      return;
    }

    setQueryBootstrapDone(true);
  }, [queryBootstrapDone, initialTeacherName, initialClassId, initialStudentId]);

  // Load students when class changes
  useEffect(() => {
    setStudentId('');
    setSubjectStates([]);
    if (!classId) { setStudents([]); return; }
    setLoadingStudents(true);
    apiClient
      .publicGetStudents({ classId })
      .then((r) => {
        const all: any[] = r.data ?? [];
        setStudents(all);
      })
      .finally(() => setLoadingStudents(false));
  }, [classId]);

  useEffect(() => {
    if (initialStudentApplied || !initialStudentId || students.length === 0) return;

    if (students.some((s) => s._id === initialStudentId)) {
      setStudentId(initialStudentId);
    }

    // Apply URL-provided student only once so user can change selection freely.
    setInitialStudentApplied(true);
  }, [initialStudentApplied, initialStudentId, students]);

  // Load subjects + existing marks when student changes
  useEffect(() => {
    setSubjectStates([]);
    setCoScholasticStates([]);
    if (!studentId || !classId) return;
    setLoadingSubjects(true);

    Promise.all([
      apiClient.publicGetSubjects({ classId }),
      apiClient.getMarks({ studentId }),
      apiClient.getCoScholasticMarksByStudent(studentId),
      apiClient.getRemarkByStudent(studentId),
    ])
      .then(([subjectsRes, marksRes, coScholasticRes, remarkRes]) => {
        const subjects: any[] = subjectsRes.data ?? subjectsRes;
        const marks: any[] = marksRes.data ?? marksRes;
        const coScholasticMarks: any[] = coScholasticRes.data ?? coScholasticRes;

        const states: SubjectMarksState[] = subjects.map((sub) => {
          const existing = marks.find(
            (m) =>
              (m.subjectId?._id ?? m.subjectId) === sub._id
          );
          return {
            subjectId: sub._id,
            subjectName: sub.name,
            maxMarks: sub.maxMarks,
            existingId: existing?._id,
            term1: {
              periodicTest: numOrEmpty(existing?.term1?.periodicTest),
              notebook: numOrEmpty(existing?.term1?.notebook),
              subEnrichment: numOrEmpty(existing?.term1?.subEnrichment),
              halfYearlyExam: numOrEmpty(existing?.term1?.halfYearlyExam),
            },
            term2: {
              periodicTest: numOrEmpty(existing?.term2?.periodicTest),
              notebook: numOrEmpty(existing?.term2?.notebook),
              subEnrichment: numOrEmpty(existing?.term2?.subEnrichment),
              yearlyExam: numOrEmpty(existing?.term2?.yearlyExam),
            },
            saving: false,
            saved: false,
            error: null,
          };
        });

        const coScholasticStates: CoScholasticMarksState[] = CO_SCHOLASTIC_AREAS.map((area) => {
          const existing = coScholasticMarks.find((m) => m.area === area);
          return {
            area,
            existingId: existing?._id,
            term1: numOrEmpty(existing?.term1),
            term2: numOrEmpty(existing?.term2),
            saving: false,
            saved: false,
            error: null,
          };
        });

        setSubjectStates(states);
        setCoScholasticStates(coScholasticStates);
        setRemarkState({ text: remarkRes?.data?.text ?? remarkRes?.text ?? '', teacherName: remarkRes?.data?.teacherName ?? remarkRes?.teacherName ?? '', saving: false, saved: false, error: null });
      })
      .finally(() => setLoadingSubjects(false));
  }, [studentId, classId]);

  function updateRemarkField(text: string) {
    setRemarkState((p) => ({ ...p, text, saved: false, error: null }));
  }

  async function saveRemark() {
    if (!studentId) { alert('Select a student first.'); return; }
    setRemarkState((p) => ({ ...p, saving: true, error: null }));
    try {
      const payload = { studentId, teacherName: teacherName?.trim() ?? '', text: remarkState.text };
      const res = await apiClient.createOrUpdateRemark(payload);
      setRemarkState((p) => ({ ...p, saving: false, saved: true, error: null, text: res?.data?.text ?? res?.text ?? p.text }));
    } catch (err: any) {
      setRemarkState((p) => ({ ...p, saving: false, saved: false, error: err?.message ?? 'Failed to save' }));
      throw err;
    }
  }

  async function saveAllMarks() {
    if (!studentId) {
      alert('Select a student first.');
      return false;
    }

    if (teacherName.trim()) {
      await Promise.all(subjectStates.map((_, idx) => saveSubject(idx, true)));
    }

    if (coScholasticStates.length > 0) {
      await Promise.all(coScholasticStates.map((_, idx) => saveCoScholasticArea(idx, true)));
    }

    if (remarkState.text.trim() || remarkState.saved) {
      await saveRemark();
    }

    return true;
  }

  function updateField(
    idx: number,
    term: 'term1' | 'term2',
    field: string,
    raw: string
  ) {
    setSubjectStates((prev) => {
      const next = [...prev];
      const s = { ...next[idx] };
      const parsed = raw === '' ? '' : Number(raw);
      s[term] = { ...s[term], [field]: parsed };
      s.saved = false;
      s.error = null;
      next[idx] = s;
      return next;
    });
  }

  async function saveSubject(idx: number, shouldThrow = false) {
    if (!teacherName.trim()) {
      alert('Please enter teacher name before saving.');
      return;
    }
    const s = subjectStates[idx];

    // Build term objects with only numeric values
    function clean(obj: TermMarks) {
      const result: Record<string, number> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v !== '' && v !== undefined && v !== null) result[k] = Number(v);
      }
      return result;
    }

    const body = {
      studentId,
      subjectId: s.subjectId,
      teacherName: teacherName.trim(),
      term1: clean(s.term1),
      term2: clean(s.term2),
    };

    setSubjectStates((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], saving: true, error: null };
      return next;
    });

    try {
      let result: any;
      if (s.existingId) {
        result = await apiClient.updateMarks(s.existingId, {
          teacherName: body.teacherName,
          term1: body.term1,
          term2: body.term2,
        });
      } else {
        result = await apiClient.createMarks(body);
      }
      setSubjectStates((prev) => {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          saving: false,
          saved: true,
          error: null,
          existingId: result?.data?._id ?? next[idx].existingId,
        };
        return next;
      });
    } catch (err: any) {
      setSubjectStates((prev) => {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          saving: false,
          saved: false,
          error: err?.message ?? 'Failed to save',
        };
        return next;
      });
      if (shouldThrow) throw err;
    }
  }

  async function saveCoScholasticArea(idx: number, shouldThrow = false) {
    const s = coScholasticStates[idx];
    const body = {
      studentId,
      area: s.area,
      ...(s.term1 !== '' && { term1: Number(s.term1) }),
      ...(s.term2 !== '' && { term2: Number(s.term2) }),
    };

    setCoScholasticStates((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], saving: true, error: null };
      return next;
    });

    try {
      const result = await apiClient.createOrUpdateCoScholasticMarks(body);
      setCoScholasticStates((prev) => {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          saving: false,
          saved: true,
          error: null,
          existingId: result?.data?._id ?? next[idx].existingId,
        };
        return next;
      });
    } catch (err: any) {
      setCoScholasticStates((prev) => {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          saving: false,
          saved: false,
          error: err?.message ?? 'Failed to save',
        };
        return next;
      });
      if (shouldThrow) throw err;
    }
  }

  function updateCoScholasticField(idx: number, term: 'term1' | 'term2', value: string) {
    setCoScholasticStates((prev) => {
      const next = [...prev];
      const s = { ...next[idx] };
      const parsed = value === '' ? '' : Number(value);
      s[term] = parsed;
      s.saved = false;
      s.error = null;
      next[idx] = s;
      return next;
    });
  }

  async function generateReport() {
    if (!studentId) {
      alert('Select a student first.');
      return;
    }

    try {
      await saveAllMarks();
    } catch {
      return;
    }

    setReportLoading(true);
    try {
      const blob = await apiClient.getStudentReportPdf(studentId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err: any) {
      alert(err?.message ?? 'Failed to generate report');
    } finally {
      setReportLoading(false);
    }
  }

  const selectedStudent = students.find((s) => s._id === studentId);
  const selectedClass = classes.find((c) => c._id === classId);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="mb-3 text-sm text-orange-600 hover:underline">← Back</button>
        <h2 className="text-xl font-semibold">Marks Entry</h2>
        <p className="text-sm text-black/60">
          Select a class and student to enter marks for all subjects at once.
        </p>
      </div>

      {isAdminMode && (
        <AdminMarksExcelBulk
          classId={classId}
          className={selectedClass?.name}
          teacherName={teacherName}
        />
      )}

      {/* Step 1 — Class + Student + Teacher */}
      <div className="grid gap-3 md:grid-cols-3 rounded-lg border border-black/10 p-4 bg-black/[0.02]">
        <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
          <span>Class</span>
          <select
            id="marks-class-select"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2 font-normal bg-white"
          >
            <option value="">— Select class —</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
          <span>Student</span>
          <select
            id="marks-student-select"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled={!classId || loadingStudents}
            className="rounded-md border border-black/15 px-3 py-2 font-normal bg-white disabled:opacity-50"
          >
            <option value="">
              {loadingStudents ? 'Loading…' : '— Select student —'}
            </option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} {s.rollNo ? `(Roll ${s.rollNo})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-black/80">
          <span>Teacher Name</span>
          <select
            id="marks-teacher-name"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2 font-normal bg-white"
          >
            <option value="">Select teacher</option>
            {teachers.map((t) => (
              <option key={t._id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Student info badge */}
      {selectedStudent && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="rounded-full bg-orange-50 text-orange-700 px-3 py-1 font-medium">
            {selectedStudent.name}
          </span>
          <span className="text-black/50">Reg: {selectedStudent.regNo}</span>
          {selectedStudent.rollNo && (
            <span className="text-black/50">Roll: {selectedStudent.rollNo}</span>
          )}
        </div>
      )}

      {/* Progress steps */}
      <div className="mt-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <StepDot step={1} current={currentStep} onClick={() => setCurrentStep(1)}>Subject</StepDot>
          <div className="flex-1 h-px bg-black/10" />
          <StepDot step={2} current={currentStep} onClick={() => setCurrentStep(2)}>Co-Scholastic</StepDot>
          <div className="flex-1 h-px bg-black/10" />
          <StepDot step={3} current={currentStep} onClick={() => setCurrentStep(3)}>Remarks</StepDot>
        </div>
      </div>

      {/* Loading subjects */}
      {loadingSubjects && (
        <div className="mt-8 text-center text-black/50 text-sm">
          Loading subjects…
        </div>
      )}

      {/* No subjects empty state */}
      {!loadingSubjects && studentId && subjectStates.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-black/15 p-8 text-center text-sm text-black/50">
          No subjects found for this class. Add subjects first from the Subjects page.
        </div>
      )}

      {/* Subject cards — step 1 */}
      {currentStep === 1 && subjectStates.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-base font-semibold">Scholastic Marks</h3>
          {subjectStates.map((s, idx) => (
            <SubjectCard
              key={s.subjectId}
              state={s}
              onFieldChange={(term, field, val) => updateField(idx, term, field, val)}
              onSave={() => saveSubject(idx)}
            />
          ))}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button onClick={async () => { try { await saveAllMarks(); setCurrentStep(2); } catch { /* errors already surfaced */ } }} className="rounded-md bg-black text-white px-4 py-2">Save & Next</button>
          </div>
        </div>
      )}

      {/* Co-scholastic marks — step 2 */}
      {currentStep === 2 && coScholasticStates.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-base font-semibold">Co-Scholastic Marks</h3>
          {coScholasticStates.map((s, idx) => (
            <CoScholasticCard
              key={s.area}
              state={s}
              onFieldChange={(term, val) => updateCoScholasticField(idx, term, val)}
              onSave={() => saveCoScholasticArea(idx)}
            />
          ))}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button onClick={() => setCurrentStep(1)} className="rounded-md border px-4 py-2">Previous</button>
            <button onClick={async () => { try { await saveAllMarks(); setCurrentStep(3); } catch { /* errors already surfaced */ } }} className="rounded-md bg-black text-white px-4 py-2">Save & Next</button>
          </div>
        </div>
      )}

      {/* Remarks — step 3 */}
      {currentStep === 3 && (
        <div className="mt-8 rounded-lg border border-black/10 p-4 bg-white">
          <h3 className="text-base font-semibold">Class Teacher's Remarks</h3>
          <p className="text-sm text-black/60 mb-3">Enter remarks that will appear on the report card.</p>
          <textarea
            value={remarkState.text}
            onChange={(e) => updateRemarkField(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-black/15 p-3"
            placeholder="Write class teacher's remarks here..."
          />

          <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button onClick={() => setCurrentStep(2)} className="rounded-md border px-4 py-2">Previous</button>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button onClick={async () => { try { await saveAllMarks(); } catch { /* errors already surfaced */ } }} disabled={remarkState.saving} className="rounded-md bg-orange-500 text-white px-4 py-2">{remarkState.saving ? 'Saving…' : 'Save All'}</button>
              {studentId && (
                <button onClick={generateReport} disabled={reportLoading} className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{reportLoading ? 'Generating…' : 'Generate Report'}</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SubjectCard component
// ────────────────────────────────────────────────────────────────────────────
function SubjectCard({
  state,
  onFieldChange,
  onSave,
}: {
  state: SubjectMarksState;
  onFieldChange: (term: 'term1' | 'term2', field: string, val: string) => void;
  onSave: () => void;
}) {
  const { subjectName, maxMarks, term1, term2, saving, saved, error } = state;

  return (
    <div className="rounded-lg border border-black/10 bg-white overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-black/8 bg-black/[0.02]">
        <div className="font-semibold text-sm">{subjectName}</div>
        <div className="flex items-center gap-3">
          {saved && !saving && (
            <span className="text-xs text-green-600 font-medium">✓ Saved</span>
          )}
          {error && (
            <span className="text-xs text-red-600 font-medium">{error}</span>
          )}
          <button
            id={`save-marks-${state.subjectId}`}
            onClick={onSave}
            disabled={saving}
            className="rounded-md bg-orange-500 text-white px-4 py-1.5 text-sm disabled:opacity-60 hover:bg-orange-600 transition-colors"
          >
            {saving ? 'Saving…' : state.existingId ? 'Update' : 'Save'}
          </button>
        </div>
      </div>

      {/* Terms grid */}
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/8">
        {/* Term 1 */}
        <div className="p-4">
          <div className="text-xs font-semibold text-black/50 uppercase tracking-wider mb-3">
            Term 1
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MarksInput
              label="Periodic Test"
              max={maxMarks?.term1?.periodicTest}
              value={term1.periodicTest ?? ''}
              onChange={(v) => onFieldChange('term1', 'periodicTest', v)}
            />
            <MarksInput
              label="Notebook"
              max={maxMarks?.term1?.notebook}
              value={term1.notebook ?? ''}
              onChange={(v) => onFieldChange('term1', 'notebook', v)}
            />
            <MarksInput
              label="Sub Enrichment"
              max={maxMarks?.term1?.subEnrichment}
              value={term1.subEnrichment ?? ''}
              onChange={(v) => onFieldChange('term1', 'subEnrichment', v)}
            />
            <MarksInput
              label="Half Yearly Exam"
              max={maxMarks?.term1?.halfYearlyExam}
              value={term1.halfYearlyExam ?? ''}
              onChange={(v) => onFieldChange('term1', 'halfYearlyExam', v)}
            />
          </div>
        </div>

        {/* Term 2 */}
        <div className="p-4">
          <div className="text-xs font-semibold text-black/50 uppercase tracking-wider mb-3">
            Term 2
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MarksInput
              label="Periodic Test"
              max={maxMarks?.term2?.periodicTest}
              value={term2.periodicTest ?? ''}
              onChange={(v) => onFieldChange('term2', 'periodicTest', v)}
            />
            <MarksInput
              label="Notebook"
              max={maxMarks?.term2?.notebook}
              value={term2.notebook ?? ''}
              onChange={(v) => onFieldChange('term2', 'notebook', v)}
            />
            <MarksInput
              label="Sub Enrichment"
              max={maxMarks?.term2?.subEnrichment}
              value={term2.subEnrichment ?? ''}
              onChange={(v) => onFieldChange('term2', 'subEnrichment', v)}
            />
            <MarksInput
              label="Yearly Exam"
              max={maxMarks?.term2?.yearlyExam}
              value={term2.yearlyExam ?? ''}
              onChange={(v) => onFieldChange('term2', 'yearlyExam', v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Small reusable marks input with max display
// ────────────────────────────────────────────────────────────────────────────
function MarksInput({
  label,
  max,
  value,
  onChange,
}: {
  label: string;
  max?: number;
  value: number | '';
  onChange: (v: string) => void;
}) {
  const overMax =
    max !== undefined && value !== '' && Number(value) > max;

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-black/70">
        {label}
        {max !== undefined && (
          <span className="ml-1 text-black/40 font-normal">/ {max}</span>
        )}
      </span>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'rounded-md border px-3 py-1.5 font-normal w-full',
          overMax
            ? 'border-red-400 bg-red-50 text-red-700'
            : 'border-black/15 bg-white',
        ].join(' ')}
        placeholder="—"
      />
      {overMax && (
        <span className="text-xs text-red-500">Exceeds max ({max})</span>
      )}
    </label>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// CoScholasticCard component
// ────────────────────────────────────────────────────────────────────────────
function CoScholasticCard({
  state,
  onFieldChange,
  onSave,
}: {
  state: CoScholasticMarksState;
  onFieldChange: (term: 'term1' | 'term2', val: string) => void;
  onSave: () => void;
}) {
  const { area, term1, term2, saving, saved, error } = state;
  const term1Invalid = term1 !== '' && (Number(term1) < 0 || Number(term1) > 100);
  const term2Invalid = term2 !== '' && (Number(term2) < 0 || Number(term2) > 100);
  const hasValidationError = term1Invalid || term2Invalid;

  return (
    <div className="rounded-lg border border-black/10 bg-white overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-black/8 bg-black/[0.02]">
        <div className="font-semibold text-sm">{area}</div>
        <div className="flex items-center gap-3">
          {saved && !saving && (
            <span className="text-xs text-green-600 font-medium">✓ Saved</span>
          )}
          {error && (
            <span className="text-xs text-red-600 font-medium">{error}</span>
          )}
          <button
            onClick={onSave}
            disabled={saving || hasValidationError}
            className="rounded-md bg-orange-500 text-white px-4 py-1.5 text-sm disabled:opacity-60 hover:bg-orange-600 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Marks grid */}
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/8">
        {/* Term 1 */}
        <div className="p-4">
          <div className="text-xs font-semibold text-black/50 uppercase tracking-wider mb-3">
            Term 1
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-black/70">Marks / 100</span>
            <input
              type="number"
              min={0}
              max={100}
              value={term1}
              onChange={(e) => onFieldChange('term1', e.target.value)}
              className={[
                'rounded-md border px-3 py-1.5 font-normal w-full',
                term1Invalid ? 'border-red-400 bg-red-50 text-red-700' : 'border-black/15 bg-white',
              ].join(' ')}
              placeholder="—"
            />
            {term1Invalid && (
              <span className="text-xs text-red-500">Must be between 0 and 100</span>
            )}
          </label>
        </div>

        {/* Term 2 */}
        <div className="p-4">
          <div className="text-xs font-semibold text-black/50 uppercase tracking-wider mb-3">
            Term 2
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-black/70">Marks / 100</span>
            <input
              type="number"
              min={0}
              max={100}
              value={term2}
              onChange={(e) => onFieldChange('term2', e.target.value)}
              className={[
                'rounded-md border px-3 py-1.5 font-normal w-full',
                term2Invalid ? 'border-red-400 bg-red-50 text-red-700' : 'border-black/15 bg-white',
              ].join(' ')}
              placeholder="—"
            />
            {term2Invalid && (
              <span className="text-xs text-red-500">Must be between 0 and 100</span>
            )}
          </label>
        </div>
      </div>
    </div>
  );
}

function StepDot({ step, current, children, onClick }: { step: number; current: number; children: any; onClick?: () => void }) {
  const active = step === current;
  return (
    <button onClick={onClick} className={[
      'flex items-center gap-2 cursor-pointer',
      active ? 'text-black font-semibold' : 'text-black/50'
    ].join(' ')}>
      <div className={[
        'w-7 h-7 rounded-full flex items-center justify-center text-xs',
        active ? 'bg-black text-white' : 'bg-white border border-black/10'
      ].join(' ')}>{step}</div>
      <div className="text-sm">{children}</div>
    </button>
  );
}
