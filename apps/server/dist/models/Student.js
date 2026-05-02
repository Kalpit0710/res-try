"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Student = void 0;
const mongoose_1 = require("mongoose");
const StudentSchema = new mongoose_1.Schema({
    regNo: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    dob: { type: Date },
    classId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Class', required: true },
    rollNo: { type: String, trim: true },
}, { timestamps: true });
StudentSchema.index({ classId: 1 });
StudentSchema.index({ name: 'text', regNo: 'text' });
exports.Student = (0, mongoose_1.model)('Student', StudentSchema);
