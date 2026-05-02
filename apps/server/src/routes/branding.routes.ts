import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import {
  getBranding,
  upsertBrandingAssets,
  upsertTeacherSignature,
  removeBrandingAsset,
  removeTeacherSignature,
} from '../controllers/branding.controller';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
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

router.get('/branding', authenticate, getBranding);
router.post(
  '/branding',
  authenticate,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'principalSignature', maxCount: 1 },
  ]),
  upsertBrandingAssets
);

router.post(
  '/branding/teacher-signature',
  authenticate,
  upload.fields([{ name: 'signature', maxCount: 1 }]),
  upsertTeacherSignature
);

router.delete('/branding/asset/:assetKey', authenticate, removeBrandingAsset);
router.delete('/branding/teacher-signature/:teacherId', authenticate, removeTeacherSignature);

export default router;
