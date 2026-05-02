"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeachers = getTeachers;
exports.getTeacherById = getTeacherById;
exports.createTeacher = createTeacher;
exports.updateTeacher = updateTeacher;
exports.deleteTeacher = deleteTeacher;
const zod_1 = require("zod");
const Teacher_1 = require("../models/Teacher");
const TeacherCreateSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'name is required'),
});
const TeacherUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'name is required').optional(),
});
async function getTeachers(_req, res) {
    const teachers = await Teacher_1.Teacher.find().sort({ name: 1 }).lean();
    res.json({ success: true, data: teachers });
}
async function getTeacherById(req, res) {
    const teacher = await Teacher_1.Teacher.findById(req.params.id).lean();
    if (!teacher) {
        res.status(404).json({ success: false, message: 'Teacher not found' });
        return;
    }
    res.json({ success: true, data: teacher });
}
async function createTeacher(req, res) {
    const parsed = TeacherCreateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Invalid body' });
        return;
    }
    const teacher = await Teacher_1.Teacher.create(parsed.data);
    res.status(201).json({ success: true, data: teacher });
}
async function updateTeacher(req, res) {
    const parsed = TeacherUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Invalid body' });
        return;
    }
    const teacher = await Teacher_1.Teacher.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true });
    if (!teacher) {
        res.status(404).json({ success: false, message: 'Teacher not found' });
        return;
    }
    res.json({ success: true, data: teacher });
}
async function deleteTeacher(req, res) {
    const teacher = await Teacher_1.Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
        res.status(404).json({ success: false, message: 'Teacher not found' });
        return;
    }
    res.json({ success: true, message: 'Teacher deleted' });
}
