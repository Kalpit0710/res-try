"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentReport = getStudentReport;
exports.bulkStudentReport = bulkStudentReport;
const archiver_1 = __importDefault(require("archiver"));
const report_service_1 = require("../services/report.service");
const Student_1 = require("../models/Student");
// GET /reports/student/:studentId
async function getStudentReport(req, res) {
    const pdf = await (0, report_service_1.generateStudentReportPdf)(req.params.studentId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="report-card.pdf"');
    res.send(pdf);
}
// POST /reports/bulk  — body: { studentIds: string[] }
async function bulkStudentReport(req, res) {
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
        res.status(400).json({ success: false, message: 'studentIds array is required' });
        return;
    }
    if (studentIds.length > 100) {
        res.status(400).json({ success: false, message: 'Maximum 100 students per bulk download' });
        return;
    }
    // Resolve student names for filenames
    const students = await Student_1.Student.find({ _id: { $in: studentIds } }).select('name regNo').lean();
    const studentMap = new Map(students.map(s => [s._id.toString(), s]));
    // Generate all PDFs in parallel
    const results = await Promise.allSettled(studentIds.map(async (id) => {
        const pdf = await (0, report_service_1.generateStudentReportPdf)(id);
        const student = studentMap.get(id);
        const safeName = (student?.name ?? id).replace(/[^a-z0-9_\-\s]/gi, '_').trim();
        const filename = `${safeName}_${student?.regNo ?? id}.pdf`;
        return { pdf, filename };
    }));
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="report-cards.zip"');
    const archive = (0, archiver_1.default)('zip', { zlib: { level: 6 } });
    archive.pipe(res);
    for (const result of results) {
        if (result.status === 'fulfilled') {
            archive.append(result.value.pdf, { name: result.value.filename });
        }
    }
    await archive.finalize();
}
