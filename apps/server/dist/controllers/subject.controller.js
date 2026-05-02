"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubjects = getSubjects;
exports.getSubjectById = getSubjectById;
exports.createSubject = createSubject;
exports.updateSubject = updateSubject;
exports.deleteSubject = deleteSubject;
const Subject_1 = require("../models/Subject");
async function getSubjects(req, res) {
    const { classId } = req.query;
    const query = classId ? { classId } : {};
    const subjects = await Subject_1.Subject.find(query).lean();
    res.json({ success: true, data: subjects });
}
async function getSubjectById(req, res) {
    const subject = await Subject_1.Subject.findById(req.params.id).lean();
    if (!subject) {
        res.status(404).json({ success: false, message: 'Subject not found' });
        return;
    }
    res.json({ success: true, data: subject });
}
async function createSubject(req, res) {
    const { name, classId, maxMarks } = req.body;
    if (!name || !classId) {
        res.status(400).json({ success: false, message: 'name and classId are required' });
        return;
    }
    const subject = await Subject_1.Subject.create({ name, classId, maxMarks });
    res.status(201).json({ success: true, data: subject });
}
async function updateSubject(req, res) {
    const { name, classId, maxMarks } = req.body;
    const subject = await Subject_1.Subject.findByIdAndUpdate(req.params.id, { name, classId, maxMarks }, { new: true, runValidators: true });
    if (!subject) {
        res.status(404).json({ success: false, message: 'Subject not found' });
        return;
    }
    res.json({ success: true, data: subject });
}
async function deleteSubject(req, res) {
    const subject = await Subject_1.Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
        res.status(404).json({ success: false, message: 'Subject not found' });
        return;
    }
    res.json({ success: true, message: 'Subject deleted' });
}
