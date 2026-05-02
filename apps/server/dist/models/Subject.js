"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subject = void 0;
const mongoose_1 = require("mongoose");
const ComponentMarks = {
    periodicTest: { type: Number, default: 10 },
    notebook: { type: Number, default: 5 },
    subEnrichment: { type: Number, default: 5 },
};
const SubjectSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    classId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Class', required: true },
    maxMarks: {
        term1: {
            ...ComponentMarks,
            halfYearlyExam: { type: Number, default: 30 },
        },
        term2: {
            ...ComponentMarks,
            yearlyExam: { type: Number, default: 30 },
        },
    },
}, { timestamps: true });
SubjectSchema.index({ classId: 1 });
exports.Subject = (0, mongoose_1.model)('Subject', SubjectSchema);
