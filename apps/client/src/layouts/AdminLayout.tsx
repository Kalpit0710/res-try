import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { clearToken } from '../lib/auth';

const nav = [
  { to: '/admin', label: 'Dashboard', end: true, icon: DashboardIcon },
  { to: '/admin/students', label: 'Students', icon: StudentsIcon },
  { to: '/admin/classes', label: 'Classes', icon: ClassesIcon },
  { to: '/admin/subjects', label: 'Subjects', icon: SubjectsIcon },
  { to: '/admin/teachers', label: 'Teachers', icon: TeachersIcon },
  { to: '/admin/marks', label: 'Marks Entry', icon: MarksIcon },
  { to: '/admin/reports', label: 'Reports', icon: ReportsIcon },
  { to: '/admin/logs', label: 'Logs', icon: LogsIcon },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
];

const mobileNav = [nav[0], nav[6], nav[8]];

function IconShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}

function DashboardIcon({ className = '' }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.5V19h11v-8.5" />
      <path d="M10 19v-5h4v5" />
    </IconShell>
  );
}

function StudentsIcon({ className = '' }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M16 17c0-1.7-1.8-3-4-3s-4 1.3-4 3" />
      <circle cx="12" cy="8" r="2.5" />
      <path d="M6.5 18.5c.6-1.6 2-2.8 3.7-3.3" />
      <path d="M17.5 18.5c-.6-1.6-2-2.8-3.7-3.3" />
    </IconShell>
  );
}

function ClassesIcon({ className = '' }: { className?: string }) {
  return (
    <IconShell className={className}>
      <rect x="4.5" y="5.5" width="6" height="6" rx="1.5" />
      <rect x="13.5" y="5.5" width="6" height="6" rx="1.5" />
      <rect x="4.5" y="14.5" width="6" height="4" rx="1.5" />
      <path d="M16 12v3.5" />
      <path d="M7.5 11.5v3" />
    </IconShell>
  );
}

function SubjectsIcon({ className = '' }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M5 7h10.5a2 2 0 0 1 2 2V19H7a2 2 0 0 1-2-2V7Z" />
      <path d="M8 9h6" />
      <path d="M8 12h6" />
      <path d="M8 15h4" />
    </IconShell>
  );
}

function TeachersIcon({ className = '' }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M4.5 18.5c1.1-2.6 3.3-4.2 5.5-4.2s4.4 1.6 5.5 4.2" />
      <circle cx="10" cy="9" r="2.5" />
      <path d="M14.5 7.5h5" />
      <path d="M17 5v5" />
    </IconShell>
  );
}

function MarksIcon({ className = '' }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M6 5.5h12a1 1 0 0 1 1 1v11.9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" />
      <path d="M8.5 10.5h7" />
      <path d="M8.5 14h4.5" />
      <path d="m9 7.5 1.2 1.2 2.6-2.6" />
    </IconShell>
  );
}

function ReportsIcon({ className = '' }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M6 4.5h8l4 4V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z" />
      <path d="M14 4.5V9h4" />
      <path d="M8.5 15.5v-2" />
      <path d="M11.5 15.5V11" />
      <path d="M14.5 15.5v-4" />
    </IconShell>
  );
}

function LogsIcon({ className = '' }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M7 5.5h10a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z" />
      <path d="M9 9h6" />
      <path d="M9 12h6" />
      <path d="M9 15h4" />
    </IconShell>
  );
}

function SettingsIcon({ className = '' }: { className?: string }) {
  return (
    <IconShell className={className}>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.2-1.8-3.1-2.2.8a7 7 0 0 0-1.7-1l-.3-2.3H9.1l-.3 2.3a7 7 0 0 0-1.7 1l-2.2-.8-1.8 3.1 2 1.2A7 7 0 0 0 5 12c0 .3 0 .7.1 1l-2 1.2 1.8 3.1 2.2-.8a7 7 0 0 0 1.7 1l.3 2.3h5.8l.3-2.3a7 7 0 0 0 1.7-1l2.2.8 1.8-3.1-2-1.2c.1-.3.1-.7.1-1Z" />
    </IconShell>
  );
}

function MoreIcon({ className = '' }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M4.5 7h15" />
      <path d="M4.5 12h15" />
      <path d="M4.5 17h15" />
    </IconShell>
  );
}

export function AdminLayout() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }

    document.body.style.overflow = '';
    return undefined;
  }, [mobileMenuOpen]);

  function logout() {
    clearToken();
    navigate('/login', { replace: true });
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
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
      <main className="flex-1 min-w-0 pb-28 md:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-20 border-b border-black/10 bg-white/85 backdrop-blur px-4 md:px-6 py-3 flex items-center justify-between"
        >
          <div className="font-semibold text-sm md:text-base">School Result Management System</div>
          <button onClick={logout} className="md:hidden text-sm text-orange-600">Logout</button>
        </motion.div>

        <Outlet />

        {/* Bottom nav (mobile) */}
        <nav className="md:hidden fixed bottom-3 left-3 right-3 z-30 rounded-[1.75rem] border border-white/15 bg-slate-950/95 px-2 py-2 text-white shadow-[0_28px_80px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="grid grid-cols-4 gap-1">
            {mobileNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end as any}
                  className={({ isActive }) =>
                    [
                      'flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-medium leading-none transition',
                      isActive
                        ? 'bg-gradient-to-b from-orange-400 to-orange-600 text-white shadow-[0_8px_20px_rgba(249,115,22,0.35)]'
                        : 'text-white/75 hover:bg-white/10 hover:text-white',
                    ].join(' ')
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-center">{item.label}</span>
                </NavLink>
              );
            })}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-medium leading-none text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <MoreIcon className="h-5 w-5" />
              <span className="text-center">More</span>
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {mobileMenuOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-slate-950"
              role="dialog"
              aria-modal="true"
              aria-label="More navigation menu"
            >
              <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                className="flex h-full flex-col p-4 text-white"
              >
                <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-900 px-4 py-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-white/40">More Menu</div>
                    <div className="text-lg font-semibold">All admin sections</div>
                  </div>
                  <button
                    type="button"
                    onClick={closeMobileMenu}
                    className="rounded-full border border-white/15 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4 grid flex-1 grid-cols-3 gap-2 overflow-hidden">
                  {nav.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.to}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.03 * index, type: 'spring', stiffness: 300, damping: 26 }}
                      >
                        <NavLink
                          to={item.to}
                          end={item.end as any}
                          onClick={closeMobileMenu}
                          className={({ isActive }) =>
                            [
                              'flex h-full min-h-[92px] flex-col items-center justify-center gap-2 rounded-3xl border px-2 py-2 text-center transition',
                              isActive
                                ? 'border-orange-400/60 bg-orange-500/20 text-orange-200 shadow-[0_12px_30px_rgba(249,115,22,0.15)]'
                                : 'border-white/10 bg-slate-900 text-white/85 hover:border-white/20 hover:bg-slate-800',
                            ].join(' ')
                          }
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="text-[11px] font-medium leading-tight">{item.label}</span>
                        </NavLink>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}
