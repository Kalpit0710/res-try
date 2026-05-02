"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoScholasticMarks = getCoScholasticMarks;
exports.getCoScholasticMarksByStudent = getCoScholasticMarksByStudent;
exports.createOrUpdateCoScholasticMarks = createOrUpdateCoScholasticMarks;
exports.deleteCoScholasticMarks = deleteCoScholasticMarks;
const CoScholasticMarks_1 = require("../models/CoScholasticMarks");
async function getCoScholasticMarks(req, res) {
    const { studentId } = req.query;
    const query = {};
    if (studentId)
        query.studentId = studentId;
    const marks = await CoScholasticMarks_1.CoScholasticMarks.find(query).populate('studentId', 'name regNo').lean();
    res.json({ success: true, data: marks });
}
async function getCoScholasticMarksByStudent(req, res) {
    const { studentId } = req.params;
    const marks = await CoScholasticMarks_1.CoScholasticMarks.find({ studentId }).lean();
    res.json({ success: true, data: marks });
}
async function createOrUpdateCoScholasticMarks(req, res) {
    const { studentId, area, term1, term2 } = req.body;
    if (!studentId || !area) {
        res.status(400).json({ success: false, message: 'studentId and area are required' });
        return;
    }
    const marks = await CoScholasticMarks_1.CoScholasticMarks.findOneAndUpdate({ studentId, area }, { term1, term2 }, { upsert: true, new: true, runValidators: true });
    res.json({ success: true, data: marks });
}
async function deleteCoScholasticMarks(req, res) {
    const { id } = req.params;
    const marks = await CoScholasticMarks_1.CoScholasticMarks.findByIdAndDelete(id);
    if (!marks) {
        res.status(404).json({ success: false, message: 'Co-scholastic marks not found' });
        return;
    }
    res.json({ success: true, message: 'Co-scholastic marks deleted' });
}
