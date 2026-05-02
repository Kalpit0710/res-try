"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoScholasticMarks = void 0;
const mongoose_1 = require("mongoose");
const CoScholasticMarksSchema = new mongoose_1.Schema({
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Student', required: true },
    area: { type: String, required: true }, // co-scholastic area name
    term1: { type: Number, min: 0, max: 100 },
    term2: { type: Number, min: 0, max: 100 },
}, { timestamps: true });
// Compound unique index: one doc per student+area
CoScholasticMarksSchema.index({ studentId: 1, area: 1 }, { unique: true });
CoScholasticMarksSchema.index({ studentId: 1 });
exports.CoScholasticMarks = (0, mongoose_1.model)('CoScholasticMarks', CoScholasticMarksSchema);
