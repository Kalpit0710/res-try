import 'express-async-errors';
import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { getReportBrowser } from './services/report.service';

// ── Routes ────────────────────────────────────────────────────────────────────
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import classRoutes from './routes/class.routes';
import subjectRoutes from './routes/subject.routes';
import teacherRoutes from './routes/teacher.routes';
import marksRoutes from './routes/marks.routes';
import remarksRoutes from './routes/remarks.routes';
import reportRoutes from './routes/report.routes';
import logRoutes from './routes/log.routes';
import lockRoutes from './routes/lock.routes';
import brandingRoutes from './routes/branding.routes';
import publicRoutes from './routes/public.routes';
import coScholasticMarksRoutes from './routes/coScholasticMarks.routes';

dotenv.config();

const app = express();

// ── Security middleware ────────────────────────────────────────────────────────
app.use(helmet());
const allowedClientOrigin = process.env.CLIENT_URL ?? 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isLocalVite = /^http:\/\/localhost:\d+$/.test(origin);
      if (origin === allowedClientOrigin || isLocalVite) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads'), {
  setHeaders: (res, path) => {
    // Prevent caching of branding assets to ensure updates are visible immediately
    if (path.includes('/branding/')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── API routes ────────────────────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/students`, studentRoutes);
app.use(`${API}/classes`, classRoutes);
app.use(`${API}/subjects`, subjectRoutes);
app.use(`${API}/teachers`, teacherRoutes);
app.use(`${API}/marks`, marksRoutes);
app.use(`${API}/co-scholastic-marks`, coScholasticMarksRoutes);
app.use(`${API}/remarks`, remarksRoutes);
app.use(`${API}/reports`, reportRoutes);
app.use(`${API}/logs`, logRoutes);
app.use(`${API}/locks`, lockRoutes);
app.use(`${API}/settings`, brandingRoutes);
app.use(`${API}/public`, publicRoutes);

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Boot ──────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '5000', 10);

async function boot() {
  await connectDB();
  await getReportBrowser();

  app.listen(PORT, () => {
    console.log(`✅  SRMS server running on http://localhost:${PORT}`);
  });
}

boot().catch((error) => {
  console.error('❌  Server failed to start', error);
  process.exit(1);
});
