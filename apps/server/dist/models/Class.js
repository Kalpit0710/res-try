"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Class = void 0;
const mongoose_1 = require("mongoose");
const ClassSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    subjects: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Subject' }],
}, { timestamps: true });
exports.Class = (0, mongoose_1.model)('Class', ClassSchema);
