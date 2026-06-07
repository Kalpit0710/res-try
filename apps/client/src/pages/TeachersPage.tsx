import { useEffect, useState } from 'react';
import { apiClient } from '../lib/clientApi';

export function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() { 
    setLoading(true);
    try {
      const res = await apiClient.getTeachers(); 
      setTeachers(res.data ?? res); 
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm('Delete teacher?')) return;
    await apiClient.deleteTeacher(id);
    load();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Teachers</h2>
          <p className="mt-1 text-sm text-slate-500">Manage teaching staff, their class assignments, and secure access PINs.</p>
        </div>
        <button 
          onClick={() => setEditing({})} 
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Add Teacher
        </button>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 h-36"></div>
            ))}
          </div>
        ) : teachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 py-16 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No teachers found</h3>
            <p className="mt-1 text-sm text-slate-500">Get started by adding your first teacher.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {teachers.map(t => (
              <div key={t._id} className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:border-orange-200 hover:shadow-[0_8px_30px_rgba(249,115,22,0.06)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600 font-bold text-sm border border-orange-200/50">
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 line-clamp-1">{t.name}</h3>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                        {t.classId ? (typeof t.classId === 'object' ? t.classId.name : t.classId) : 'Unassigned'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="text-xs font-medium text-slate-400">
                    {t.pin ? '✓ PIN set' : '⚠ No PIN'}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => setEditing(t)} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" title="Edit">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    </button>
                    <button onClick={() => remove(t._id)} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing !== null && <TeacherForm teacher={editing} onClose={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function TeacherForm({ teacher = {}, onClose }: { teacher?: any; onClose: () => void }) {
  const [name, setName] = useState(teacher.name ?? '');
  const [classId, setClassId] = useState(teacher.classId?._id ?? teacher.classId ?? '');
  const [pin, setPin] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.publicGetClasses().then(res => setClasses(res.data ?? res));
  }, []);

  async function save() {
    if (!name.trim()) return alert('Teacher name is required.');
    
    setLoading(true);
    try {
      const data: any = { name: name.trim() };
      if (classId) data.classId = classId;
      if (pin) data.pin = pin;
      if (!teacher?._id && !pin) {
        alert('Please set an initial PIN for the new teacher.');
        setLoading(false);
        return;
      }
      if (teacher && teacher._id) {
        await apiClient.updateTeacher(teacher._id, data);
      } else {
        await apiClient.createTeacher(data);
      }
      onClose();
    } catch (err: unknown) {
      alert((err as Error)?.message ?? 'Failed to save teacher.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[1.5rem] bg-white p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)]">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{teacher._id ? 'Edit Teacher' : 'Add New Teacher'}</h3>
          <button onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        
        <div className="space-y-5">
          <label className="block">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Teacher Name</div>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Jane Doe" 
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" 
            />
          </label>

          <label className="block">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned Class</div>
              <div className="text-[10px] text-slate-400">Optional</div>
            </div>
            <select 
              value={classId} 
              onChange={e => setClassId(e.target.value)} 
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
            >
              <option value="">No class assigned</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">If assigned, their signature is used on this class's report cards.</p>
          </label>

          <label className="block">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Access PIN</div>
            <input 
              type="password"
              maxLength={6}
              value={pin} 
              onChange={e => setPin(e.target.value)} 
              placeholder="••••" 
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium tracking-widest text-slate-700 shadow-sm outline-none transition placeholder:tracking-normal hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" 
            />
            <p className="mt-1.5 text-xs text-slate-500">{teacher._id ? 'Leave blank to keep the current PIN.' : 'A 4-6 digit PIN required for teacher login.'}</p>
          </label>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
          <button 
            onClick={onClose} 
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button 
            onClick={save} 
            disabled={loading || !name.trim()} 
            className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Teacher'}
          </button>
        </div>
      </div>
    </div>
  );
}

