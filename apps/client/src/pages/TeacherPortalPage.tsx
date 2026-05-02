import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/clientApi';

export function TeacherPortalPage() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [classId, setClassId] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([apiClient.publicGetTeachers(), apiClient.publicGetClasses()]).then(([teachersRes, classesRes]) => {
      setTeachers(teachersRes.data ?? teachersRes);
      setClasses(classesRes.data ?? classesRes);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    apiClient
      .publicGetStudents({ classId, search })
      .then((res) => setStudents(res.data ?? res))
      .finally(() => setLoading(false));
  }, [classId, search]);

  const selectedTeacher = useMemo(() => teachers.find((t) => t._id === teacherId), [teachers, teacherId]);
  const selectedStudent = useMemo(() => students.find((s) => s._id === selectedStudentId), [students, selectedStudentId]);

  function continueToMarks() {
    if (!selectedTeacher || !selectedStudent) return;
    navigate(
      `/marks-entry?teacherId=${encodeURIComponent(selectedTeacher._id)}&teacherName=${encodeURIComponent(selectedTeacher.name)}&classId=${encodeURIComponent(selectedStudent.classId?._id ?? selectedStudent.classId ?? classId)}&studentId=${encodeURIComponent(selectedStudent._id)}`
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff1dc,_#fff_36%,_#eefcff_100%)] px-4 py-6 text-black md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-3 rounded-3xl border border-black/10 bg-white/80 px-5 py-4 backdrop-blur">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-black/45">Teacher Portal</div>
            <div className="text-lg font-semibold">Select teacher and student</div>
          </div>
          <Link to="/" className="text-sm text-orange-700 hover:underline">
            Back to Home
          </Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <section className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)] backdrop-blur">
            <h1 className="text-3xl font-black tracking-tight">Teacher Portal</h1>
            <p className="mt-3 text-sm leading-6 text-black/65">
              Choose your teacher profile, search a class or student, then open the marks entry screen.
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <div className="mb-1 text-sm font-medium">Teacher</div>
                <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm">
                  <option value="">Select teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="mb-1 text-sm font-medium">Class</div>
                <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm">
                  <option value="">All classes</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="mb-1 text-sm font-medium">Search student</div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or reg. no"
                  className="w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Students</h2>
                <p className="text-sm text-black/55">Search by name, reg. no, or filter by class.</p>
              </div>
              <div className="text-sm text-black/50">{loading ? 'Loading…' : `${students.length} result(s)`}</div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {students.map((student) => {
                const isSelected = selectedStudentId === student._id;
                return (
                  <button
                    key={student._id}
                    onClick={() => setSelectedStudentId(student._id)}
                    className={[
                      'rounded-2xl border p-4 text-left transition',
                      isSelected ? 'border-orange-400 bg-orange-50 shadow' : 'border-black/10 bg-white hover:border-orange-200 hover:bg-orange-50/40',
                    ].join(' ')}
                  >
                    <div className="text-sm font-semibold">{student.name}</div>
                    <div className="mt-1 text-xs text-black/55">Reg No: {student.regNo}</div>
                    <div className="mt-1 text-xs text-black/55">Class: {student.classId?.name ?? '-'}</div>
                    <div className="mt-2 text-xs font-medium text-orange-700">{isSelected ? 'Selected' : 'Select'}</div>
                  </button>
                );
              })}

              {!loading && students.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/15 px-4 py-10 text-center text-sm text-black/45 md:col-span-2 xl:col-span-3">
                  No students found. Try another search or class filter.
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-[linear-gradient(180deg,#fff,#fff8f1)] p-4">
              <div className="text-sm text-black/65">
                {selectedTeacher ? <span className="font-medium text-black">Teacher: {selectedTeacher.name}</span> : 'Pick a teacher to continue.'}
                {selectedStudent ? <span className="ml-2 font-medium text-black">Student: {selectedStudent.name}</span> : null}
              </div>
              <button
                onClick={continueToMarks}
                disabled={!selectedTeacher || !selectedStudent}
                className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue to Marks Entry
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default TeacherPortalPage;
