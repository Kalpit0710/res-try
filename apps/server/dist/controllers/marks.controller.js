"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMarks = getMarks;
exports.createMarks = createMarks;
exports.updateMarks = updateMarks;
const zod_1 = require("zod");
const Marks_1 = require("../models/Marks");
const Subject_1 = require("../models/Subject");
const Student_1 = require("../models/Student");
const Teacher_1 = require("../models/Teacher");
const Log_1 = require("../models/Log");
const lock_service_1 = require("../services/lock.service");
const Term1Schema = zod_1.z
    .object({
    periodicTest: zod_1.z.number().min(0).optional(),
    notebook: zod_1.z.number().min(0).optional(),
    subEnrichment: zod_1.z.number().min(0).optional(),
    halfYearlyExam: zod_1.z.number().min(0).optional(),
})
    .partial();
const Term2Schema = zod_1.z
    .object({
    periodicTest: zod_1.z.number().min(0).optional(),
    notebook: zod_1.z.number().min(0).optional(),
    subEnrichment: zod_1.z.number().min(0).optional(),
    yearlyExam: zod_1.z.number().min(0).optional(),
})
    .partial();
const MarksCreateSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1),
    subjectId: zod_1.z.string().min(1),
    teacherName: zod_1.z.string().trim().min(1),
    term1: Term1Schema.optional(),
    term2: Term2Schema.optional(),
});
const MarksUpdateSchema = zod_1.z.object({
    teacherName: zod_1.z.string().trim().min(1),
    term1: Term1Schema.optional(),
    term2: Term2Schema.optional(),
});
function assertWithinMax(params) {
    if (params.term1) {
        for (const [k, v] of Object.entries(params.term1)) {
            if (v == null)
                continue;
            const max = params.maxMarks.term1[k];
            if (typeof max === 'number' && v > max)
                return `term1.${k} exceeds max (${max})`;
        }
    }
    if (params.term2) {
        for (const [k, v] of Object.entries(params.term2)) {
            if (v == null)
                continue;
            const max = params.maxMarks.term2[k];
            if (typeof max === 'number' && v > max)
                return `term2.${k} exceeds max (${max})`;
        }
    }
    return null;
}
// GET /marks?studentId=&subjectId=
async function getMarks(req, res) {
    const { studentId, subjectId } = req.query;
    const query = {};
    if (studentId)
        query.studentId = studentId;
    if (subjectId)
        query.subjectId = subjectId;
    const marks = await Marks_1.Marks.find(query)
        .populate('studentId', 'name regNo classId rollNo')
        .populate('subjectId', 'name classId maxMarks')
        .sort({ updatedAt: -1 })
        .lean();
    res.json({ success: true, data: marks });
}
// POST /marks
async function createMarks(req, res) {
    const parsed = MarksCreateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Invalid body' });
        return;
    }
    const { studentId, subjectId, teacherName, term1, term2 } = parsed.data;
    const [student, subject, teacher] = await Promise.all([
        Student_1.Student.findById(studentId).lean(),
        Subject_1.Subject.findById(subjectId).lean(),
        Teacher_1.Teacher.findOne({ name: teacherName }).lean(),
    ]);
    if (!student) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
    }
    if (!subject) {
        res.status(404).json({ success: false, message: 'Subject not found' });
        return;
    }
    if (!teacher) {
        res.status(400).json({ success: false, message: 'Teacher not found' });
        return;
    }
    const lock = await (0, lock_service_1.checkLocks)({
        studentId,
        classId: student.classId.toString(),
        teacherReference: teacherName,
    });
    if (lock.locked) {
        res.status(403).json({ success: false, message: lock.reason });
        return;
    }
    const maxError = assertWithinMax({ term1, term2, maxMarks: subject.maxMarks });
    if (maxError) {
        res.status(400).json({ success: false, message: maxError });
        return;
    }
    const doc = await Marks_1.Marks.findOneAndUpdate({ studentId, subjectId }, { $set: { teacherName, term1: term1 ?? {}, term2: term2 ?? {} } }, { new: true, upsert: true, runValidators: true });
    await Log_1.Log.create({
        teacherName,
        action: 'marks_saved',
        studentId,
        subjectId,
    });
    res.status(201).json({ success: true, data: doc });
}
// PUT /marks/:id
async function updateMarks(req, res) {
    const parsed = MarksUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Invalid body' });
        return;
    }
    const existing = await Marks_1.Marks.findById(req.params.id).lean();
    if (!existing) {
        res.status(404).json({ success: false, message: 'Marks entry not found' });
        return;
    }
    const { teacherName, term1, term2 } = parsed.data;
    const [student, subject, teacher] = await Promise.all([
        Student_1.Student.findById(existing.studentId).lean(),
        Subject_1.Subject.findById(existing.subjectId).lean(),
        Teacher_1.Teacher.findOne({ name: teacherName }).lean(),
    ]);
    if (!student || !subject) {
        res.status(400).json({ success: false, message: 'Invalid student/subject reference' });
        return;
    }
    if (!teacher) {
        res.status(400).json({ success: false, message: 'Teacher not found' });
        return;
    }
    const lock = await (0, lock_service_1.checkLocks)({
        studentId: student._id.toString(),
        classId: student.classId.toString(),
        teacherReference: teacherName,
    });
    if (lock.locked) {
        res.status(403).json({ success: false, message: lock.reason });
        return;
    }
    const mergedTerm1 = { ...existing.term1, ...(term1 ?? {}) };
    const mergedTerm2 = { ...existing.term2, ...(term2 ?? {}) };
    const maxError = assertWithinMax({ term1: mergedTerm1, term2: mergedTerm2, maxMarks: subject.maxMarks });
    if (maxError) {
        res.status(400).json({ success: false, message: maxError });
        return;
    }
    const doc = await Marks_1.Marks.findByIdAndUpdate(req.params.id, { $set: { teacherName, term1: mergedTerm1, term2: mergedTerm2 } }, { new: true, runValidators: true });
    await Log_1.Log.create({
        teacherName,
        action: 'marks_updated',
        studentId: student._id,
        subjectId: subject._id,
    });
    res.json({ success: true, data: doc });
}
