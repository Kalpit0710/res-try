import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clearToken } from '../lib/auth';

const nav = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/students', label: 'Students' },
  { to: '/admin/classes', label: 'Classes' },
  { to: '/admin/subjects', label: 'Subjects' },
  { to: '/admin/teachers', label: 'Teachers' },
  { to: '/admin/marks', label: 'Marks Entry' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/logs', label: 'Logs' },
  { to: '/admin/settings', label: 'Settings' },
];

export function AdminLayout() {
  const navigate = useNavigate();

  function logout() {
    clearToken();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff_0%,#fff8f1_100%)] text-black flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 border-r border-black/10 bg-white/85 backdrop-blur p-4 flex-col gap-2 md:sticky md:top-0 md:self-start md:h-screen md:overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-black/60">SRMS</div>
            <div className="font-semibold">Admin</div>
          </div>
          <button onClick={logout} className="text-sm text-orange-600">Logout</button>
        </div>

        <nav className="mt-4 flex flex-col gap-1">
          {nav.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end as any}
              className={({ isActive }) =>
                [
                  'rounded-md px-3 py-2 text-sm',
                  isActive ? 'bg-orange-50 text-orange-700' : 'hover:bg-black/5',
                ].join(' ')
              }
            >
              {i.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-20 border-b border-black/10 bg-white/80 backdrop-blur px-4 md:px-6 py-3 flex items-center justify-between"
        >
          <div className="font-semibold">School Result Management System</div>
          <button onClick={logout} className="md:hidden text-sm text-orange-600">Logout</button>
        </motion.div>

        <Outlet />

        {/* Bottom nav (mobile) */}
        <nav className="md:hidden fixed bottom-3 left-3 right-3 border border-black/10 rounded-2xl bg-white/95 backdrop-blur px-2 py-2 flex justify-between">
          {nav.slice(0, 5).map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end as any}
              className={({ isActive }) =>
                [
                  'flex-1 text-center text-xs px-2 py-2 rounded-xl',
                  isActive ? 'bg-orange-50 text-orange-700' : 'text-black/70',
                ].join(' ')
              }
            >
              {i.label}
            </NavLink>
          ))}
        </nav>
        <div className="md:hidden h-20" />
      </main>
    </div>
  );
}
