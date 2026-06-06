import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/clientApi';
import { extractClassId, useDebounce } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { SessionTimer } from '../components/SessionTimer';

type StudentSearchMode = 'name' | 'regNo' | 'class';
const ITEMS_PER_PAGE = 6;



export function TeacherPortalPage() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [displayedStudents, setDisplayedStudents] = useState<any[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [searchMode, setSearchMode] = useState<StudentSearchMode>('name');
  const [searchText, setSearchText] = useState('');
  const [classId, setClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchText = useDebounce(searchText, 400);

  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [resetPinError, setResetPinError] = useState('');

  // Auto-logout handled by SessionTimer

  useEffect(() => {
    const token = sessionStorage.getItem('srms_teacher_token');
    const tid = sessionStorage.getItem('srms_teacher_id');
    if (token && tid) {
      setTeacherId(tid);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    Promise.all([apiClient.publicGetTeachers(), apiClient.publicGetClasses()]).then(([teachersRes, classesRes]) => {
      setTeachers(teachersRes.data ?? teachersRes);
      setClasses(classesRes.data ?? classesRes);
    });
  }, []);

  // Fetch students based on search criteria
  useEffect(() => {
    let active = true;

    if (!isLoggedIn) {
      setAllStudents([]);
      setDisplayedStudents([]);
      setCurrentPage(1);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    if (searchMode === 'class') {
      if (!classId) {
        setAllStudents([]);
        setDisplayedStudents([]);
        setCurrentPage(1);
        setLoading(false);
        return () => {
          active = false;
        };
      }

      setLoading(true);
      apiClient
        .publicGetStudents({ classId })
        .then((res) => {
          if (active) {
            const students = res.data ?? res;
            setAllStudents(students);
            setCurrentPage(1);
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }

    const query = searchText.trim();
    if (!query) {
      setAllStudents([]);
      setDisplayedStudents([]);
      setCurrentPage(1);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    apiClient
      .publicGetStudents({ search: debouncedSearchText })
      .then((res) => {
        if (active) {
          const students = res.data ?? res;
          setAllStudents(students);
          setCurrentPage(1);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [classId, searchMode, debouncedSearchText, isLoggedIn]);

  // Update displayed students based on current page
  useEffect(() => {
    const startIdx = 0;
    const endIdx = currentPage * ITEMS_PER_PAGE;
    setDisplayedStudents(allStudents.slice(startIdx, endIdx));
  }, [allStudents, currentPage]);

  useEffect(() => {
    setSelectedStudentId('');
  }, [classId, searchMode, debouncedSearchText, isLoggedIn]);

  const selectedTeacher = useMemo(() => teachers.find((t) => t._id === teacherId), [teachers, teacherId]);
  const selectedStudent = useMemo(() => allStudents.find((s) => s._id === selectedStudentId), [allStudents, selectedStudentId]);
  const currentStep = selectedStudent ? 3 : isLoggedIn ? 2 : 1;
  const hasStudentCriteria = searchMode === 'class' ? Boolean(classId) : Boolean(searchText.trim());
  const totalPages = Math.ceil(allStudents.length / ITEMS_PER_PAGE);
  const hasMoreStudents = currentPage < totalPages;

  // Auto-select teacher's linked class when teacher is selected
  useEffect(() => {
    if (!isLoggedIn) return; // Wait until logged in to auto-select
    if (selectedTeacher && selectedTeacher.classId) {
      const linkedClassId = extractClassId(selectedTeacher.classId);
      if (linkedClassId) {
        setSearchMode('class');
        setClassId(linkedClassId);
        setSearchText('');
        setAllStudents([]);
        setDisplayedStudents([]);
        setCurrentPage(1);
        setSelectedStudentId('');
      }
    } else {
      // If teacher has no linked class, reset to name search
      if (teacherId && !selectedTeacher?.classId) {
        setSearchMode('name');
        setClassId('');
      }
    }
  }, [selectedTeacher, teacherId, isLoggedIn]);

  async function handleLogin() {
    if (!teacherId) return;
    if (!pin) { setPinError('PIN is required'); return; }
    
    setIsLoggingIn(true);
    setPinError('');
    try {
      const res = await fetch(`${(import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:5000/api/v1'}/auth/teacher/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, pin: btoa(pin) })
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('srms_teacher_token', data.data.token);
        sessionStorage.setItem('srms_teacher_id', teacherId);
        setIsLoggedIn(true);
        setPin('');
      } else {
        setPinError(data.message || 'Invalid PIN');
      }
    } catch (err: any) {
      setPinError('Failed to login. Check connection.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleResetPin() {
    if (!oldPin || !newPin || newPin.length < 4 || newPin.length > 6) {
      setResetPinError('Both old and new valid PIN (4-6 digits) are required');
      return;
    }
    setIsResettingPin(true);
    setResetPinError('');
    try {
      if (oldPin === newPin) {
        setResetPinError('new pin cant be same as old one');
        return;
      }
      
      const token = sessionStorage.getItem('srms_teacher_token');
      const payload = {
        oldPin: btoa(oldPin),
        newPin: btoa(newPin)
      };
      
      const res = await fetch(`${(import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:5000/api/v1'}/auth/teacher/reset-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('PIN changed successfully');
        setOldPin('');
        setNewPin('');
        setIsChangePinModalOpen(false);
      } else {
        setResetPinError(data.message || 'Failed to change PIN');
      }
    } catch (err: any) {
      setResetPinError('Failed to change PIN');
    } finally {
      setIsResettingPin(false);
    }
  }

  function handleLogout() {
    setIsLoggedIn(false);
    setTeacherId('');
    sessionStorage.removeItem('srms_teacher_token');
    sessionStorage.removeItem('srms_teacher_id');
  }

  function changeSearchMode(mode: StudentSearchMode) {
    setSearchMode(mode);
    setAllStudents([]);
    setDisplayedStudents([]);
    setCurrentPage(1);
    setSelectedStudentId('');

    if (mode === 'class') {
      setSearchText('');
    } else {
      setClassId('');
    }
  }

  function continueToMarks() {
    if (!selectedTeacher || !selectedStudent) return;

    const resolvedClassId = extractClassId(selectedStudent.classId) || classId;
    navigate(
      `/marks-entry?teacherId=${encodeURIComponent(selectedTeacher._id)}&teacherName=${encodeURIComponent(selectedTeacher.name)}&classId=${encodeURIComponent(resolvedClassId)}&studentId=${encodeURIComponent(selectedStudent._id)}`
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff1dc,_#fff_36%,_#eefcff_100%)] px-3 py-4 text-black sm:px-4 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 rounded-3xl border border-black/10 bg-white/85 px-4 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-black/45">Teacher Portal</div>
            <div className="text-base font-semibold sm:text-lg">Select teacher and student</div>
          </div>
          <Link to="/" className="self-start text-sm text-orange-700 hover:underline sm:self-auto">
            Back to Home
          </Link>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.72fr_1.28fr] lg:gap-6">
          <section className="rounded-[1.75rem] border border-black/10 bg-white/92 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.08)] backdrop-blur sm:p-6">
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Teacher Portal</h1>
            <p className="mt-3 text-sm leading-6 text-black/65">
              Pick a teacher first, then search one student at a time before opening marks entry.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3">
              <StepDot step={1} current={currentStep}>Teacher</StepDot>
              <div className="hidden h-px flex-1 bg-black/10 sm:block" />
              <StepDot step={2} current={currentStep}>Student</StepDot>
              <div className="hidden h-px flex-1 bg-black/10 sm:block" />
              <StepDot step={3} current={currentStep}>Marks</StepDot>
            </div>

            <div className="mt-5 space-y-4">
              {!isLoggedIn ? (
                <div className="space-y-4 rounded-[1.25rem] border border-orange-200/60 bg-gradient-to-b from-orange-50/50 to-orange-100/30 p-5 shadow-[0_4px_20px_rgba(249,115,22,0.05)]">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
                      Teacher Authentication
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Please verify your identity to access marks entry.</p>
                  </div>
                  <label className="block mt-4">
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Select your name</div>
                    <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10">
                      <option value="">Select teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {teacherId && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block">
                        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Enter PIN</div>
                        <input
                          type="password"
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                          placeholder="••••"
                          maxLength={6}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium tracking-widest text-slate-700 shadow-sm outline-none transition placeholder:tracking-normal hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                        />
                      </label>
                      {pinError && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                          {pinError}
                        </div>
                      )}
                      <button onClick={handleLogin} disabled={isLoggingIn} className="w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(234,88,12,0.3)] transition hover:bg-orange-500 hover:shadow-[0_6px_20px_rgba(234,88,12,0.4)] disabled:pointer-events-none disabled:opacity-50">
                        {isLoggingIn ? 'Verifying...' : 'Login Securely'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-[1.25rem] border border-green-200 bg-green-50/50 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-green-700">Authenticated as</div>
                      <div className="text-sm font-bold text-green-900">{selectedTeacher?.name}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setIsChangePinModalOpen(true)} className="rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-bold text-green-700 transition hover:bg-green-50">
                      Change PIN
                    </button>
                    <button onClick={handleLogout} className="rounded-lg px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100">
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

              {isLoggedIn && (
                <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#fff7ed)] p-3 sm:p-4 shadow-[0_8px_20px_rgba(0,0,0,0.03)]">
                  <div className="text-sm font-semibold text-slate-900">Search student</div>
                <div className="mt-1 text-xs leading-5 text-slate-600">Search by name, reg. no, or filter by class. Use one path at a time.</div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                  <button
                    type="button"
                    onClick={() => changeSearchMode('name')}
                    disabled={!teacherId}
                    className={[
                      'rounded-full border px-2 py-2 text-[9px] leading-tight transition disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-[10px]',
                      searchMode === 'name'
                        ? 'border-orange-500 bg-orange-100 text-orange-800 shadow-[0_4px_14px_rgba(249,115,22,0.18)]'
                        : 'border-slate-200 bg-white text-slate-700 shadow-[0_1px_0_rgba(0,0,0,0.02)]',
                    ].join(' ')}
                  >
                    Name
                  </button>
                  <span className="hidden px-1 text-slate-400 sm:inline">---or---</span>
                  <button
                    type="button"
                    onClick={() => changeSearchMode('regNo')}
                    disabled={!teacherId}
                    className={[
                      'rounded-full border px-2 py-2 text-[9px] leading-tight transition disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-[10px]',
                      searchMode === 'regNo'
                        ? 'border-orange-500 bg-orange-100 text-orange-800 shadow-[0_4px_14px_rgba(249,115,22,0.18)]'
                        : 'border-slate-200 bg-white text-slate-700 shadow-[0_1px_0_rgba(0,0,0,0.02)]',
                    ].join(' ')}
                  >
                    Reg. No
                  </button>
                  <span className="hidden px-1 text-slate-400 sm:inline">---or---</span>
                  <button
                    type="button"
                    onClick={() => changeSearchMode('class')}
                    disabled={!teacherId}
                    className={[
                      'rounded-full border px-2 py-2 text-[9px] leading-tight transition disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-[10px]',
                      searchMode === 'class'
                        ? 'border-orange-500 bg-orange-100 text-orange-800 shadow-[0_4px_14px_rgba(249,115,22,0.18)]'
                        : 'border-slate-200 bg-white text-slate-700 shadow-[0_1px_0_rgba(0,0,0,0.02)]',
                    ].join(' ')}
                  >
                    Class
                  </button>
                </div>

                <div className="mt-4">
                  {searchMode === 'class' ? (
                    <label className="block">
                      <div className="mb-1 text-sm font-medium text-slate-900">Class filter</div>
                      <select
                        value={classId}
                        onChange={(e) => setClassId(e.target.value)}
                        disabled={!teacherId}
                        className="w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm disabled:cursor-not-allowed disabled:bg-black/5"
                      >
                        <option value="">Select class</option>
                        {classes.map((cls) => (
                          <option key={cls._id} value={cls._id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label className="block">
                      <div className="mb-1 text-sm font-medium text-slate-900">{searchMode === 'regNo' ? 'Search by reg. no' : 'Search by name'}</div>
                      <input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder={searchMode === 'regNo' ? 'Type a registration number' : 'Type a student name'}
                        disabled={!teacherId}
                        className="w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm disabled:cursor-not-allowed disabled:bg-black/5"
                      />
                    </label>
                  )}
                </div>
              </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Students</h2>
                <p className="text-sm text-black/55">Search one student by name, reg. no, or class before continuing.</p>
              </div>
              <div className="text-sm text-black/50">
                {loading ? 'Loading…' : (isLoggedIn && hasStudentCriteria) ? `${displayedStudents.length} of ${allStudents.length} result(s)` : 'Waiting for search'}
              </div>
            </div>

            {!isLoggedIn ? (
              <div className="mt-4 rounded-2xl border border-dashed border-black/15 px-4 py-10 text-center text-sm text-black/45">
                Please log in to unlock the student search.
              </div>
            ) : !hasStudentCriteria ? (
              <div className="mt-4 rounded-2xl border border-dashed border-black/15 px-4 py-10 text-center text-sm text-black/45">
                Choose a search path above, then enter a name, reg. no, or class.
              </div>
            ) : loading && allStudents.length === 0 ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-dashed border-black/15 px-4 py-10 text-center text-sm text-black/45">
                  Loading students…
                </div>
              </div>
            ) : allStudents.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-black/15 px-4 py-10 text-center text-sm text-black/45">
                No students found. Try another search path or value.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {/* Progress Bar */}
                <div className="rounded-xl border border-black/10 bg-gradient-to-r from-orange-50 to-orange-100/40 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
                    <span className="text-xs font-medium text-black/70">Showing {displayedStudents.length} of {allStudents.length} students</span>
                    <span className="text-xs text-black/50">{currentPage} of {totalPages}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white border border-black/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-300"
                      style={{ width: `${(displayedStudents.length / allStudents.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Student Grid */}
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {displayedStudents.map((student) => {
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
                </div>

                {/* Load More Button */}
                {hasMoreStudents && (
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={loading}
                    className="w-full rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? 'Loading more students…' : `Load More (${Math.min(ITEMS_PER_PAGE, allStudents.length - displayedStudents.length)} more)`}
                  </button>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-black/10 bg-[linear-gradient(180deg,#fff,#fff8f1)] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-black/65">
                {selectedTeacher ? <span className="font-medium text-black">Teacher: {selectedTeacher.name}</span> : 'Pick a teacher to continue.'}
                {selectedStudent ? <span className="ml-2 font-medium text-black">Student: {selectedStudent.name}</span> : null}
              </div>
              <button
                onClick={continueToMarks}
                disabled={!selectedTeacher || !selectedStudent}
                className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:self-start"
              >
                Continue to Marks Entry
              </button>
            </div>
          </section>
        </div>
      </div>
      
      {isLoggedIn && <SessionTimer onLogout={() => {
        setIsLoggedIn(false);
        setTeacherId('');
      }} />}
      
      {/* Change PIN Modal */}
      {isChangePinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-sm rounded-[1.5rem] bg-white p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)]">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Change PIN</h3>
              <button onClick={() => { setIsChangePinModalOpen(false); setResetPinError(''); setOldPin(''); setNewPin(''); }} className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <label className="block">
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Old PIN</div>
                <input
                  type="password"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="••••"
                  maxLength={6}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium tracking-widest text-slate-700 shadow-sm outline-none transition placeholder:tracking-normal hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                />
              </label>
              
              <label className="block">
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">New PIN</div>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="••••"
                  maxLength={6}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium tracking-widest text-slate-700 shadow-sm outline-none transition placeholder:tracking-normal hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                />
              </label>
              
              {resetPinError && (
                <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                  {resetPinError}
                </div>
              )}
              
              <button onClick={handleResetPin} disabled={isResettingPin} className="mt-2 w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(234,88,12,0.3)] transition hover:bg-orange-500 disabled:pointer-events-none disabled:opacity-50">
                {isResettingPin ? 'Saving...' : 'Update PIN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepDot({
  step,
  current,
  children,
}: {
  step: number;
  current: number;
  children: ReactNode;
}) {
  const active = current >= step;

  return (
    <div
      className={[
        'flex min-w-0 items-center gap-2 rounded-full border px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition sm:px-3 sm:text-xs sm:tracking-[0.22em]',
        active ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-black/10 bg-white text-black/35',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black',
          active ? 'bg-orange-500 text-white' : 'bg-black/10 text-black/40',
        ].join(' ')}
      >
        {step}
      </span>
      <span className="whitespace-nowrap">{children}</span>
    </div>
  );
}

export default TeacherPortalPage;
