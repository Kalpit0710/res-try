"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Marks = void 0;
const mongoose_1 = require("mongoose");
const TermMarksSchema = {
    periodicTest: { type: Number, min: 0 },
    notebook: { type: Number, min: 0 },
    subEnrichment: { type: Number, min: 0 },
};
const MarksSchema = new mongoose_1.Schema({
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Student', required: true },
    subjectId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacherName: { type: String, required: true },
    term1: {
        ...TermMarksSchema,
        halfYearlyExam: { type: Number, min: 0 },
    },
    term2: {
        ...TermMarksSchema,
        yearlyExam: { type: Number, min: 0 },
    },
}, { timestamps: true });
// Compound unique index: one marks doc per student+subject
MarksSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });
MarksSchema.index({ studentId: 1 });
exports.Marks = (0, mongoose_1.model)('Marks', MarksSchema);
