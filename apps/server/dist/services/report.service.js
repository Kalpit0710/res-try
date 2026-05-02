"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStudentReportPdf = generateStudentReportPdf;
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const fs_1 = __importDefault(require("fs"));
const Branding_1 = require("../models/Branding");
const Student_1 = require("../models/Student");
const Class_1 = require("../models/Class");
const Subject_1 = require("../models/Subject");
const Marks_1 = require("../models/Marks");
const CoScholasticMarks_1 = require("../models/CoScholasticMarks");
const shared_1 = require("@srms/shared");
function resolveAssetDataUri(relativePath) {
    if (!relativePath)
        return null;
    const normalized = relativePath.replace(/^\//, '');
    const absolutePath = path_1.default.resolve(process.cwd(), normalized);
    if (!fs_1.default.existsSync(absolutePath))
        return null;
    const ext = path_1.default.extname(absolutePath).toLowerCase();
    const mime = ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.webp'
            ? 'image/webp'
            : 'image/png';
    const bytes = fs_1.default.readFileSync(absolutePath);
    return `data:${mime};base64,${bytes.toString('base64')}`;
}
function resolveBrowserExecutablePath() {
    const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
    if (fromEnv)
        return fromEnv;
    // Common Windows installs (best-effort, optional)
    const candidates = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    ];
    for (const p of candidates) {
        if (fs_1.default.existsSync(p))
            return p;
    }
    throw new Error('No browser executable found. Set PUPPETEER_EXECUTABLE_PATH to a Chrome/Edge executable path.');
}
function getCoScholasticGrade(marks) {
    if (marks === undefined || marks === null)
        return '—';
    if (marks >= 91)
        return 'A1';
    if (marks >= 81)
        return 'A2';
    if (marks >= 71)
        return 'B1';
    if (marks >= 61)
        return 'B2';
    if (marks >= 51)
        return 'C1';
    if (marks >= 41)
        return 'C2';
    if (marks >= 33)
        return 'D';
    return 'E';
}
async function generateStudentReportPdf(studentId) {
    const student = await Student_1.Student.findById(studentId).lean();
    if (!student)
        throw new Error('Student not found');
    const cls = await Class_1.Class.findById(student.classId).lean();
    if (!cls)
        throw new Error('Class not found');
    const subjects = await Subject_1.Subject.find({ classId: cls._id }).sort({ name: 1 }).lean();
    const marks = await Marks_1.Marks.find({ studentId: student._id }).lean();
    const coScholasticMarks = await CoScholasticMarks_1.CoScholasticMarks.find({ studentId: student._id }).lean();
    const marksMap = new Map(marks.map(m => [m.subjectId.toString(), m]));
    const subjectResults = subjects.map(s => {
        const m = marksMap.get(s._id.toString());
        return {
            subject: s,
            marks: m,
            result: (0, shared_1.calcSubjectResult)(s._id.toString(), s.name, m?.term1 ?? {}, m?.term2 ?? {}, s.maxMarks.term1, s.maxMarks.term2),
        };
    });
    const overall = {
        subjects: subjectResults.map(r => r.result),
        ...(0, shared_1.calcOverallResult)(subjectResults.map(r => r.result)),
    };
    const coScholasticData = coScholasticMarks.map((m) => ({
        area: m.area,
        term1: m.term1,
        term2: m.term2,
        grade: m.term1 || m.term2 ? getCoScholasticGrade(m.term1 ?? m.term2) : '—',
    }));
    const branding = await Branding_1.Branding.findOne({ key: 'singleton' }).lean();
    const firstMarkedTeacher = marks.find((m) => Boolean(m.teacherName))?.teacherName?.trim();
    const teacherSignature = branding?.teacherSignatures?.find((s) => {
        if (!firstMarkedTeacher)
            return false;
        return s.teacherId === firstMarkedTeacher || s.teacherName.toLowerCase() === firstMarkedTeacher.toLowerCase();
    }) ?? branding?.teacherSignatures?.[0];
    const templatePath = path_1.default.join(__dirname, '../templates/reportCard.ejs');
    const html = await ejs_1.default.renderFile(templatePath, {
        schoolName: process.env.SCHOOL_NAME ?? 'School Name',
        academicSession: process.env.ACADEMIC_SESSION ?? '2025-26',
        student,
        className: cls.name,
        subjectResults,
        overall,
        coScholasticMarks: coScholasticData,
        schoolLogoDataUri: resolveAssetDataUri(branding?.logoUrl),
        principalSignatureDataUri: resolveAssetDataUri(branding?.principalSignatureUrl),
        teacherSignatureDataUri: resolveAssetDataUri(teacherSignature?.signatureUrl),
        generatedAt: new Date(),
    });
    const browser = await puppeteer_core_1.default.launch({
        headless: true,
        executablePath: resolveBrowserExecutablePath(),
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
            preferCSSPageSize: true,
        });
        return Buffer.from(pdf);
    }
    finally {
        await browser.close();
    }
}
