"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Branding = void 0;
const mongoose_1 = require("mongoose");
const BrandingSchema = new mongoose_1.Schema({
    key: { type: String, required: true, unique: true, default: 'singleton' },
    logoUrl: { type: String },
    principalSignatureUrl: { type: String },
    teacherSignatures: {
        type: [
            {
                teacherId: { type: String, required: true },
                teacherName: { type: String, required: true },
                signatureUrl: { type: String, required: true },
            },
        ],
        default: [],
    },
}, { timestamps: true });
exports.Branding = (0, mongoose_1.model)('Branding', BrandingSchema);
