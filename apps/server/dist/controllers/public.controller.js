"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicClasses = getPublicClasses;
exports.getPublicStudents = getPublicStudents;
exports.getPublicSubjects = getPublicSubjects;
exports.getPublicTeachers = getPublicTeachers;
const Class_1 = require("../models/Class");
const Student_1 = require("../models/Student");
const Subject_1 = require("../models/Subject");
const Teacher_1 = require("../models/Teacher");
async function getPublicClasses(_req, res) {
    const classes = await Class_1.Class.find().sort({ name: 1 }).lean();
    res.json({ success: true, data: classes });
}
async function getPublicStudents(req, res) {
    const { classId, search = '' } = req.query;
    const query = {};
    if (classId)
        query.classId = classId;
    if (search.trim()) {
        query.$or = [
            { name: { $regex: search.trim(), $options: 'i' } },
            { regNo: { $regex: search.trim(), $options: 'i' } },
        ];
    }
    const students = await Student_1.Student.find(query).populate('classId', 'name').sort({ name: 1 }).lean();
    res.json({ success: true, data: students });
}
async function getPublicSubjects(req, res) {
    const { classId } = req.query;
    const query = {};
    if (classId)
        query.classId = classId;
    const subjects = await Subject_1.Subject.find(query).sort({ name: 1 }).lean();
    res.json({ success: true, data: subjects });
}
async function getPublicTeachers(_req, res) {
    const teachers = await Teacher_1.Teacher.find().sort({ name: 1 }).lean();
    res.json({ success: true, data: teachers });
}
