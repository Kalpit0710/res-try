"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const branding_controller_1 = require("../controllers/branding.controller");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const ok = ['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype);
        if (!ok) {
            cb(new Error('Only PNG, JPG, and WEBP images are allowed.'));
            return;
        }
        cb(null, true);
    },
});
router.get('/branding', auth_1.authenticate, branding_controller_1.getBranding);
router.post('/branding', auth_1.authenticate, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'principalSignature', maxCount: 1 },
]), branding_controller_1.upsertBrandingAssets);
router.post('/branding/teacher-signature', auth_1.authenticate, upload.fields([{ name: 'signature', maxCount: 1 }]), branding_controller_1.upsertTeacherSignature);
router.delete('/branding/asset/:assetKey', auth_1.authenticate, branding_controller_1.removeBrandingAsset);
router.delete('/branding/teacher-signature/:teacherId', auth_1.authenticate, branding_controller_1.removeTeacherSignature);
exports.default = router;
