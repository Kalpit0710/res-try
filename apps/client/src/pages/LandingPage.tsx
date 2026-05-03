import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const highlights = [
  { title: 'Fast Result Entry', text: 'Teachers can search a class, pick a student, and enter marks in one uninterrupted flow.' },
  { title: 'Print-Ready PDFs', text: 'Report cards are generated through Puppeteer with branding assets, signatures, and consistent layout.' },
  { title: 'Admin Controls', text: 'Students, classes, subjects, teachers, locks, logs, and branding assets are managed from one dashboard.' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff1dc,_#fff_36%,_#eefcff_100%)] text-black">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 rounded-3xl border border-black/10 bg-white/80 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-black/45">SRMS</div>
            <div className="text-lg font-semibold">School Result Management System</div>
          </div>
          <div className="text-sm text-black/55 sm:text-right">Students, marks, reports, and branding in one place.</div>
        </motion.header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-black/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] backdrop-blur md:p-10"
          >
            <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">
              School Result Workflow
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
              A clean landing page for admins and teachers.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-black/65 md:text-lg">
              SRMS centralizes student records, marks entry, PDF report generation, locks, and branding.
              Admins get a full control panel. Teachers get a fast portal to select teacher, choose a class or search a student, and enter marks without admin login friction.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/login"
                className="rounded-full bg-black px-5 py-3 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black/90"
              >
                Admin Login
              </Link>
              <Link
                to="/teacher-portal"
                className="rounded-full border border-black/15 bg-white px-5 py-3 text-center text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:border-orange-300 hover:text-orange-700"
              >
                Teachers Portal
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-black/10 bg-[linear-gradient(180deg,#fff,#fff9f2)] p-4">
                  <div className="text-sm font-semibold">{item.title}</div>
                  <p className="mt-2 text-sm leading-6 text-black/60">{item.text}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-[2rem] border border-black/10 bg-[linear-gradient(180deg,#111,#2b1d12)] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.15)]"
          >
            <div className="text-xs uppercase tracking-[0.3em] text-white/45">Project Overview</div>
            <div className="mt-3 text-2xl font-bold">Built for school result operations</div>
            <div className="mt-4 space-y-4 text-sm leading-6 text-white/75">
              <p>• Admin dashboard with locks, logs, and branding management</p>
              <p>• Teacher portal with student search by name, reg no, or class</p>
              <p>• PDF report cards with school logo and signatures</p>
              <p>• Modern UI with sticky navigation and mobile-friendly layouts</p>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-white/40">Flow</div>
              <div className="mt-3 space-y-3 text-sm">
                <div className="rounded-xl bg-white/10 px-3 py-2">1. Choose Admin Login or Teachers Portal</div>
                <div className="rounded-xl bg-white/10 px-3 py-2">2. Teachers select teacher + student</div>
                <div className="rounded-xl bg-white/10 px-3 py-2">3. Enter marks and generate results</div>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
