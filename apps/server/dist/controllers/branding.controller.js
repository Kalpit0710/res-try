"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBranding = getBranding;
exports.upsertBrandingAssets = upsertBrandingAssets;
exports.upsertTeacherSignature = upsertTeacherSignature;
exports.removeBrandingAsset = removeBrandingAsset;
exports.removeTeacherSignature = removeTeacherSignature;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Branding_1 = require("../models/Branding");
const Teacher_1 = require("../models/Teacher");
const BRANDING_KEY = 'singleton';
function getUploadsRoot() {
    return path_1.default.resolve(process.cwd(), 'uploads', 'branding');
}
function ensureUploadsRoot() {
    const root = getUploadsRoot();
    if (!fs_1.default.existsSync(root)) {
        fs_1.default.mkdirSync(root, { recursive: true });
    }
}
function saveUploadedFile(file) {
    ensureUploadsRoot();
    const ext = path_1.default.extname(file.originalname) || '.png';
    const safeExt = ext.toLowerCase();
    const name = `${file.fieldname}-${Date.now()}${safeExt}`;
    const fullPath = path_1.default.join(getUploadsRoot(), name);
    fs_1.default.writeFileSync(fullPath, file.buffer);
    return `/uploads/branding/${name}`;
}
function deleteSavedFile(relativePath) {
    if (!relativePath)
        return;
    const normalized = relativePath.replace(/^\//, '');
    const fullPath = path_1.default.resolve(process.cwd(), normalized);
    if (fs_1.default.existsSync(fullPath))
        fs_1.default.unlinkSync(fullPath);
}
async function getBranding(req, res) {
    const data = await Branding_1.Branding.findOne({ key: BRANDING_KEY }).lean();
    res.json({ success: true, data: data ?? { key: BRANDING_KEY } });
}
async function upsertBrandingAssets(req, res) {
    const files = (req.files && !Array.isArray(req.files) ? req.files : {});
    const updates = {};
    if (files.logo?.[0]) {
        updates.logoUrl = saveUploadedFile(files.logo[0]);
    }
    if (files.principalSignature?.[0]) {
        updates.principalSignatureUrl = saveUploadedFile(files.principalSignature[0]);
    }
    if (!Object.keys(updates).length) {
        res.status(400).json({ success: false, message: 'No files uploaded. Use logo or principalSignature fields.' });
        return;
    }
    const data = await Branding_1.Branding.findOneAndUpdate({ key: BRANDING_KEY }, { $set: updates, $setOnInsert: { key: BRANDING_KEY } }, { new: true, upsert: true });
    res.json({ success: true, data });
}
// POST /settings/branding/teacher-signature (multipart field: signature)
async function upsertTeacherSignature(req, res) {
    const teacherId = String(req.body.teacherId ?? '').trim();
    if (!teacherId) {
        res.status(400).json({ success: false, message: 'teacherId is required' });
        return;
    }
    const teacher = await Teacher_1.Teacher.findById(teacherId).lean();
    if (!teacher) {
        res.status(404).json({ success: false, message: 'Teacher not found' });
        return;
    }
    const files = (req.files && !Array.isArray(req.files) ? req.files : {});
    const file = files.signature?.[0];
    if (!file) {
        res.status(400).json({ success: false, message: 'signature image is required' });
        return;
    }
    const signatureUrl = saveUploadedFile(file);
    const existing = await Branding_1.Branding.findOne({ key: BRANDING_KEY });
    if (existing) {
        const current = existing.teacherSignatures ?? [];
        const prev = current.find((s) => s.teacherId === teacherId);
        if (prev?.signatureUrl)
            deleteSavedFile(prev.signatureUrl);
        const next = [
            ...current.filter((s) => s.teacherId !== teacherId),
            { teacherId, teacherName: teacher.name, signatureUrl },
        ];
        existing.teacherSignatures = next;
        await existing.save();
        res.json({ success: true, data: existing });
        return;
    }
    const created = await Branding_1.Branding.create({
        key: BRANDING_KEY,
        teacherSignatures: [{ teacherId, teacherName: teacher.name, signatureUrl }],
    });
    res.status(201).json({ success: true, data: created });
}
// DELETE /settings/branding/asset/:assetKey
async function removeBrandingAsset(req, res) {
    const assetKey = String(req.params.assetKey ?? '').trim();
    if (!['logo', 'principalSignature'].includes(assetKey)) {
        res.status(400).json({ success: false, message: 'assetKey must be logo or principalSignature' });
        return;
    }
    const branding = await Branding_1.Branding.findOne({ key: BRANDING_KEY });
    if (!branding) {
        res.status(404).json({ success: false, message: 'Branding settings not found' });
        return;
    }
    if (assetKey === 'logo') {
        deleteSavedFile(branding.logoUrl);
        branding.logoUrl = undefined;
    }
    if (assetKey === 'principalSignature') {
        deleteSavedFile(branding.principalSignatureUrl);
        branding.principalSignatureUrl = undefined;
    }
    await branding.save();
    res.json({ success: true, data: branding });
}
// DELETE /settings/branding/teacher-signature/:teacherId
async function removeTeacherSignature(req, res) {
    const teacherId = String(req.params.teacherId ?? '').trim();
    if (!teacherId) {
        res.status(400).json({ success: false, message: 'teacherId is required' });
        return;
    }
    const branding = await Branding_1.Branding.findOne({ key: BRANDING_KEY });
    if (!branding) {
        res.status(404).json({ success: false, message: 'Branding settings not found' });
        return;
    }
    const current = branding.teacherSignatures ?? [];
    const target = current.find((s) => s.teacherId === teacherId);
    if (!target) {
        res.status(404).json({ success: false, message: 'Teacher signature not found' });
        return;
    }
    deleteSavedFile(target.signatureUrl);
    branding.teacherSignatures = current.filter((s) => s.teacherId !== teacherId);
    await branding.save();
    res.json({ success: true, data: branding });
}
