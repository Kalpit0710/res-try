"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogs = getLogs;
const Log_1 = require("../models/Log");
// GET /logs?teacherName=&studentId=&subjectId=&from=&to=
async function getLogs(req, res) {
    const { teacherName, studentId, subjectId, from, to } = req.query;
    const query = {};
    if (teacherName)
        query.teacherName = teacherName;
    if (studentId)
        query.studentId = studentId;
    if (subjectId)
        query.subjectId = subjectId;
    if (from || to) {
        query.timestamp = {};
        if (from)
            query.timestamp.$gte = new Date(from);
        if (to)
            query.timestamp.$lte = new Date(to);
    }
    const logs = await Log_1.Log.find(query)
        .sort({ timestamp: -1 })
        .limit(500)
        .populate('studentId', 'name regNo')
        .populate('subjectId', 'name')
        .lean();
    res.json({ success: true, data: logs });
}
