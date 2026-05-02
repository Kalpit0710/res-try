"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = void 0;
const mongoose_1 = require("mongoose");
const LogSchema = new mongoose_1.Schema({
    teacherName: { type: String, required: true },
    action: { type: String, required: true },
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Student' },
    subjectId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Subject' },
    timestamp: { type: Date, default: Date.now },
});
LogSchema.index({ studentId: 1 });
LogSchema.index({ timestamp: -1 });
exports.Log = (0, mongoose_1.model)('Log', LogSchema);
