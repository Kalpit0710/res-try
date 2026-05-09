import { getToken } from './auth';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:5000/api/v1';

function headers(isJson = true) {
  const token = getToken();
  return {
    ...(isJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as Record<string, string>;
}

async function request(path: string, opts?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, opts);
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: res.statusText }))).message || res.statusText);
  return res.json().catch(() => null);
}

export const apiClient = {
  // --- Dashboard (single round-trip stats) ---
  getDashboardStats: () => request(`/dashboard/stats`, { headers: headers() }),

  // --- Public teacher portal data ---
  publicGetClasses: () => request(`/public/classes`, { headers: headers() }),
  publicGetStudents: (params: { classId?: string; search?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.classId) qs.set('classId', params.classId);
    if (params.search) qs.set('search', params.search);
    return request(`/public/students${qs.toString() ? `?${qs.toString()}` : ''}`, { headers: headers() });
  },
  publicGetSubjects: (params: { classId?: string } = {}) =>
    request(`/public/subjects${params.classId ? `?classId=${params.classId}` : ''}`, { headers: headers() }),
  publicGetTeachers: () => request(`/public/teachers`, { headers: headers() }),

  getStudents: (params: { page?: number; limit?: number; search?: string; classId?: string }) => {
    const qs = new URLSearchParams();
    qs.set('page', String(params.page ?? 1));
    qs.set('limit', String(params.limit ?? 20));
    qs.set('search', params.search ?? '');
    if (params.classId) qs.set('classId', params.classId);
    return request(`/students?${qs.toString()}`, { headers: headers() });
  },

  getStudentIds: (params: { search?: string; classId?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.classId) qs.set('classId', params.classId);
    return request(`/students/ids${qs.toString() ? `?${qs.toString()}` : ''}`, { headers: headers() });
  },

  getStudent: (id: string) => request(`/students/${id}`, { headers: headers() }),

  createStudent: (body: any) => request(`/students`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }),

  updateStudent: (id: string, body: any) => request(`/students/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) }),

  deleteStudent: (id: string) => request(`/students/${id}`, { method: 'DELETE', headers: headers() }),

  bulkUploadStudents: async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_URL}/students/bulk-upload`, { method: 'POST', body: fd, headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) } });
    if (!res.ok) throw new Error((await res.json().catch(() => ({ message: res.statusText }))).message || res.statusText);
    return res.json();
  },
  // staged bulk upload: parse (validate) then commit selected rows
  parseBulkStudents: async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_URL}/students/bulk-parse`, { method: 'POST', body: fd, headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) } });
    if (!res.ok) throw new Error((await res.json().catch(() => ({ message: res.statusText }))).message || res.statusText);
    return res.json();
  },
  commitBulkStudents: async (rows: any[]) => {
    const token = getToken();
    const res = await fetch(`${API_URL}/students/bulk-commit`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ rows }) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({ message: res.statusText }))).message || res.statusText);
    return res.json();
  },
  // --- Classes ---
  getClasses: () => request(`/classes`, { headers: headers() }),
  getClass: (id: string) => request(`/classes/${id}`, { headers: headers() }),
  createClass: (body: any) => request(`/classes`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }),
  updateClass: (id: string, body: any) => request(`/classes/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) }),
  deleteClass: (id: string) => request(`/classes/${id}`, { method: 'DELETE', headers: headers() }),
  addSubjectToClass: (classId: string, subjectId: string) => request(`/classes/${classId}/subjects`, { method: 'POST', headers: headers(), body: JSON.stringify({ subjectId }) }),
  removeSubjectFromClass: (classId: string, subjectId: string) => request(`/classes/${classId}/subjects/${subjectId}`, { method: 'DELETE', headers: headers() }),
  // --- Subjects ---
  getSubjects: (params: { classId?: string } = {}) => request(`/subjects${params.classId ? `?classId=${params.classId}` : ''}`, { headers: headers() }),
  getSubject: (id: string) => request(`/subjects/${id}`, { headers: headers() }),
  createSubject: (body: any) => request(`/subjects`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }),
  updateSubject: (id: string, body: any) => request(`/subjects/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) }),
  deleteSubject: (id: string) => request(`/subjects/${id}`, { method: 'DELETE', headers: headers() }),
  // --- Teachers ---
  getTeachers: () => request(`/teachers`, { headers: headers() }),
  getTeacher: (id: string) => request(`/teachers/${id}`, { headers: headers() }),
  createTeacher: (body: any) => request(`/teachers`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }),
  updateTeacher: (id: string, body: any) => request(`/teachers/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) }),
  deleteTeacher: (id: string) => request(`/teachers/${id}`, { method: 'DELETE', headers: headers() }),
  // --- Reports ---
  getStudentReportPdf: async (studentId: string) => {
    const res = await fetch(`${API_URL}/reports/student/${studentId}`, {
      headers: headers(false),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({ message: res.statusText }))).message || res.statusText);
    return res.blob();
  },
  bulkDownloadReports: async (studentIds: string[]) => {
    const res = await fetch(`${API_URL}/reports/bulk`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ studentIds }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({ message: res.statusText }))).message || res.statusText);
    return res.blob();
  },
  bulkDownloadReportsPdf: async (studentIds: string[]) => {
    const res = await fetch(`${API_URL}/reports/bulk-pdf`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ studentIds }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({ message: res.statusText }))).message || res.statusText);
    return res.blob();
  },
  // --- Settings (branding assets) ---
  getBranding: () => request(`/settings/branding`, { headers: headers() }),
  uploadBrandingAssets: async (payload: { logo?: File | null; principalSignature?: File | null }) => {
    const fd = new FormData();
    if (payload.logo) fd.append('logo', payload.logo);
    if (payload.principalSignature) fd.append('principalSignature', payload.principalSignature);

    const token = getToken();
    const res = await fetch(`${API_URL}/settings/branding`, {
      method: 'POST',
      body: fd,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!res.ok) throw new Error((await res.json().catch(() => ({ message: res.statusText }))).message || res.statusText);
    return res.json();
  },
  uploadTeacherSignature: async (teacherId: string, signature: File) => {
    const fd = new FormData();
    fd.append('teacherId', teacherId);
    fd.append('signature', signature);

    const token = getToken();
    const res = await fetch(`${API_URL}/settings/branding/teacher-signature`, {
      method: 'POST',
      body: fd,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!res.ok) throw new Error((await res.json().catch(() => ({ message: res.statusText }))).message || res.statusText);
    return res.json();
  },
  removeBrandingAsset: (assetKey: 'logo' | 'principalSignature') =>
    request(`/settings/branding/asset/${assetKey}`, { method: 'DELETE', headers: headers() }),
  removeTeacherSignature: (teacherId: string) =>
    request(`/settings/branding/teacher-signature/${teacherId}`, { method: 'DELETE', headers: headers() }),
  // --- Logs ---
  getLogs: (params: { teacherName?: string; studentId?: string; subjectId?: string; from?: string; to?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.teacherName) qs.set('teacherName', params.teacherName);
    if (params.studentId) qs.set('studentId', params.studentId);
    if (params.subjectId) qs.set('subjectId', params.subjectId);
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    return request(`/logs${qs.toString() ? `?${qs.toString()}` : ''}`, { headers: headers() });
  },
  // --- Locks ---
  getLocks: () => request(`/locks`, { headers: headers() }),
  createLock: (body: any) => request(`/locks`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }),
  updateLock: (id: string, body: any) => request(`/locks/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) }),
  deleteLock: (id: string) => request(`/locks/${id}`, { method: 'DELETE', headers: headers() }),
  // --- Marks ---
  getMarks: (params: { studentId?: string; subjectId?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.studentId) qs.set('studentId', params.studentId);
    if (params.subjectId) qs.set('subjectId', params.subjectId);
    return request(`/marks${qs.toString() ? `?${qs.toString()}` : ''}`, { headers: headers() });
  },
  createMarks: (body: any) => request(`/marks`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }),
  updateMarks: (id: string, body: any) => request(`/marks/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) }),
  batchSaveMarks: (items: any[]) => request(`/marks/batch`, { method: 'PUT', headers: headers(), body: JSON.stringify({ items }) }),
  // --- Remarks (class teacher) ---
  getRemarkByStudent: (studentId: string) => request(`/remarks/student/${studentId}`, { headers: headers() }),
  createOrUpdateRemark: (body: any) => request(`/remarks`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }),
  // --- Co-Scholastic Marks ---
  getCoScholasticMarks: (studentId?: string) => {
    const qs = studentId ? `?studentId=${studentId}` : '';
    return request(`/co-scholastic-marks${qs}`, { headers: headers() });
  },
  getCoScholasticMarksByStudent: (studentId: string) =>
    request(`/co-scholastic-marks/student/${studentId}`, { headers: headers() }),
  createOrUpdateCoScholasticMarks: (body: any) =>
    request(`/co-scholastic-marks`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }),
  deleteCoScholasticMarks: (id: string) =>
    request(`/co-scholastic-marks/${id}`, { method: 'DELETE', headers: headers() }),
};

export default apiClient;
