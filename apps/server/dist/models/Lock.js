"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lock = void 0;
const mongoose_1 = require("mongoose");
const LockSchema = new mongoose_1.Schema({
    type: { type: String, enum: ['system', 'class', 'student', 'teacher'], required: true },
    referenceId: { type: String, required: true },
    isLocked: { type: Boolean, default: true },
}, { timestamps: true });
LockSchema.index({ type: 1, referenceId: 1 }, { unique: true });
exports.Lock = (0, mongoose_1.model)('Lock', LockSchema);
