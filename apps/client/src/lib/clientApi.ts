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
  getStudents: (params: { page?: number; limit?: number; search?: string }) =>
    request(`/students?page=${params.page ?? 1}&limit=${params.limit ?? 20}&search=${encodeURIComponent(params.search ?? '')}`, { headers: headers() }),

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
};

export default apiClient;
