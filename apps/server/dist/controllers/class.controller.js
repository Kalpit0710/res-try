"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClasses = getClasses;
exports.getClassById = getClassById;
exports.createClass = createClass;
exports.updateClass = updateClass;
exports.deleteClass = deleteClass;
exports.addSubjectToClass = addSubjectToClass;
exports.removeSubjectFromClass = removeSubjectFromClass;
const Class_1 = require("../models/Class");
async function getClasses(_req, res) {
    const classes = await Class_1.Class.find().populate('subjects', 'name').lean();
    res.json({ success: true, data: classes });
}
async function getClassById(req, res) {
    const cls = await Class_1.Class.findById(req.params.id).populate('subjects').lean();
    if (!cls) {
        res.status(404).json({ success: false, message: 'Class not found' });
        return;
    }
    res.json({ success: true, data: cls });
}
async function createClass(req, res) {
    const { name } = req.body;
    if (!name) {
        res.status(400).json({ success: false, message: 'name is required' });
        return;
    }
    const cls = await Class_1.Class.create({ name });
    res.status(201).json({ success: true, data: cls });
}
async function updateClass(req, res) {
    const cls = await Class_1.Class.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
    if (!cls) {
        res.status(404).json({ success: false, message: 'Class not found' });
        return;
    }
    res.json({ success: true, data: cls });
}
async function deleteClass(req, res) {
    const cls = await Class_1.Class.findByIdAndDelete(req.params.id);
    if (!cls) {
        res.status(404).json({ success: false, message: 'Class not found' });
        return;
    }
    res.json({ success: true, message: 'Class deleted' });
}
async function addSubjectToClass(req, res) {
    const { subjectId } = req.body;
    const cls = await Class_1.Class.findByIdAndUpdate(req.params.id, { $addToSet: { subjects: subjectId } }, { new: true });
    if (!cls) {
        res.status(404).json({ success: false, message: 'Class not found' });
        return;
    }
    res.json({ success: true, data: cls });
}
async function removeSubjectFromClass(req, res) {
    const cls = await Class_1.Class.findByIdAndUpdate(req.params.id, { $pull: { subjects: req.params.subjectId } }, { new: true });
    if (!cls) {
        res.status(404).json({ success: false, message: 'Class not found' });
        return;
    }
    res.json({ success: true, data: cls });
}
