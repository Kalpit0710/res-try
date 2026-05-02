"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
// ── Routes ────────────────────────────────────────────────────────────────────
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const student_routes_1 = __importDefault(require("./routes/student.routes"));
const class_routes_1 = __importDefault(require("./routes/class.routes"));
const subject_routes_1 = __importDefault(require("./routes/subject.routes"));
const teacher_routes_1 = __importDefault(require("./routes/teacher.routes"));
const marks_routes_1 = __importDefault(require("./routes/marks.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const log_routes_1 = __importDefault(require("./routes/log.routes"));
const lock_routes_1 = __importDefault(require("./routes/lock.routes"));
const branding_routes_1 = __importDefault(require("./routes/branding.routes"));
const public_routes_1 = __importDefault(require("./routes/public.routes"));
const coScholasticMarks_routes_1 = __importDefault(require("./routes/coScholasticMarks.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// ── Security middleware ────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
const allowedClientOrigin = process.env.CLIENT_URL ?? 'http://localhost:5173';
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const isLocalVite = /^http:\/\/localhost:\d+$/.test(origin);
        if (origin === allowedClientOrigin || isLocalVite) {
            callback(null, true);
            return;
        }
        callback(new Error(`CORS blocked for origin ${origin}`));
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(rateLimiter_1.apiLimiter);
app.use('/uploads', express_1.default.static(path_1.default.resolve(process.cwd(), 'uploads')));
// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));
// ── API routes ────────────────────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, auth_routes_1.default);
app.use(`${API}/students`, student_routes_1.default);
app.use(`${API}/classes`, class_routes_1.default);
app.use(`${API}/subjects`, subject_routes_1.default);
app.use(`${API}/teachers`, teacher_routes_1.default);
app.use(`${API}/marks`, marks_routes_1.default);
app.use(`${API}/co-scholastic-marks`, coScholasticMarks_routes_1.default);
app.use(`${API}/reports`, report_routes_1.default);
app.use(`${API}/logs`, log_routes_1.default);
app.use(`${API}/locks`, lock_routes_1.default);
app.use(`${API}/settings`, branding_routes_1.default);
app.use(`${API}/public`, public_routes_1.default);
// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler_1.errorHandler);
// ── Boot ──────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '5000', 10);
(0, db_1.connectDB)().then(() => {
    app.listen(PORT, () => {
        console.log(`✅  SRMS server running on http://localhost:${PORT}`);
    });
});
