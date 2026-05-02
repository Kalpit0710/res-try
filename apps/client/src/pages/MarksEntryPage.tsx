import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../lib/clientApi';

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

function numOrEmpty(v: number | undefined): number | '' {
  return v === undefined || v === null ? '' : v;
}

export function MarksEntryPage() {
  const [searchParams] = useSearchParams();
  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [studentId, setStudentId] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teacherName, setTeacherName] = useState('');
  const [subjectStates, setSubjectStates] = useState<SubjectMarksState[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const initialTeacherName = searchParams.get('teacherName') ?? '';
  const initialClassId = searchParams.get('classId') ?? '';
  const initialStudentId = searchParams.get('studentId') ?? '';

  // Load classes on mount
  useEffect(() => {
    Promise.all([apiClient.publicGetClasses(), apiClient.publicGetTeachers()]).then(([classesRes, teachersRes]) => {
      setClasses(classesRes.data ?? classesRes);
      setTeachers(teachersRes.data ?? teachersRes);
    });
  }, []);

  useEffect(() => {
    if (initialTeacherName && !teacherName) setTeacherName(initialTeacherName);
    if (initialClassId && !classId) setClassId(initialClassId);
  }, [initialTeacherName, initialClassId, teacherName, classId]);

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
    if (!initialStudentId) return;
    if (students.some((s) => s._id === initialStudentId) && studentId !== initialStudentId) {
      setStudentId(initialStudentId);
    }
  }, [initialStudentId, students, studentId]);

  // Load subjects + existing marks when student changes
  useEffect(() => {
    setSubjectStates([]);
    if (!studentId || !classId) return;
    setLoadingSubjects(true);

    Promise.all([
      apiClient.publicGetSubjects({ classId }),
      apiClient.getMarks({ studentId }),
    ])
      .then(([subjectsRes, marksRes]) => {
        const subjects: any[] = subjectsRes.data ?? subjectsRes;
        const marks: any[] = marksRes.data ?? marksRes;

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

        setSubjectStates(states);
      })
      .finally(() => setLoadingSubjects(false));
  }, [studentId, classId]);

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

  async function saveSubject(idx: number) {
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
    }
  }

  async function generateReport() {
    if (!studentId) {
      alert('Select a student first.');
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Marks Entry</h2>
        <p className="text-sm text-black/60">
          Select a class and student to enter marks for all subjects at once.
        </p>
      </div>

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

      {/* Subject cards — all at once */}
      {subjectStates.length > 0 && (
        <div className="mt-6 space-y-4">
          {subjectStates.map((s, idx) => (
            <SubjectCard
              key={s.subjectId}
              state={s}
              onFieldChange={(term, field, val) => updateField(idx, term, field, val)}
              onSave={() => saveSubject(idx)}
            />
          ))}
        </div>
      )}

      {studentId ? (
        <div className="mt-8 rounded-2xl border border-black/10 bg-[linear-gradient(180deg,#fff,#fff8f1)] p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">Report</h3>
              <p className="text-sm text-black/55">Generate the final PDF report card for the selected student.</p>
            </div>
            <button
              onClick={generateReport}
              disabled={reportLoading}
              className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reportLoading ? 'Generating…' : 'Generate Report'}
            </button>
          </div>
        </div>
      ) : null}
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
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 gap-3">
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

export default MarksEntryPage;
