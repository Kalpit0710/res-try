import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { Branding } from '../models/Branding';
import { Teacher } from '../models/Teacher';

const BRANDING_KEY = 'singleton';

function getUploadsRoot(): string {
  return path.resolve(process.cwd(), 'uploads', 'branding');
}

function ensureUploadsRoot(): void {
  const root = getUploadsRoot();
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }
}

function saveUploadedFile(file: Express.Multer.File): string {
  ensureUploadsRoot();
  const ext = path.extname(file.originalname) || '.png';
  const safeExt = ext.toLowerCase();
  const name = `${file.fieldname}-${Date.now()}${safeExt}`;
  const fullPath = path.join(getUploadsRoot(), name);
  fs.writeFileSync(fullPath, file.buffer);
  return `/uploads/branding/${name}`;
}

function deleteSavedFile(relativePath?: string): void {
  if (!relativePath) return;
  const normalized = relativePath.replace(/^\//, '');
  const fullPath = path.resolve(process.cwd(), normalized);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
}

export async function getBranding(req: Request, res: Response): Promise<void> {
  const data = await Branding.findOne({ key: BRANDING_KEY }).lean();
  res.json({ success: true, data: data ?? { key: BRANDING_KEY } });
}

export async function upsertBrandingAssets(req: Request, res: Response): Promise<void> {
  const files = (req.files && !Array.isArray(req.files) ? req.files : {}) as Record<string, Express.Multer.File[]>;

  const updates: Record<string, string> = {};

  // Get current branding to delete old files
  const currentBranding = await Branding.findOne({ key: BRANDING_KEY });

  if (files.logo?.[0]) {
    // Delete old logo file
    if (currentBranding?.logoUrl) {
      deleteSavedFile(currentBranding.logoUrl);
    }
    updates.logoUrl = saveUploadedFile(files.logo[0]);
  }

  if (files.principalSignature?.[0]) {
    // Delete old principal signature file
    if (currentBranding?.principalSignatureUrl) {
      deleteSavedFile(currentBranding.principalSignatureUrl);
    }
    updates.principalSignatureUrl = saveUploadedFile(files.principalSignature[0]);
  }

  if (!Object.keys(updates).length) {
    res.status(400).json({ success: false, message: 'No files uploaded. Use logo or principalSignature fields.' });
    return;
  }

  const data = await Branding.findOneAndUpdate(
    { key: BRANDING_KEY },
    { $set: updates, $setOnInsert: { key: BRANDING_KEY } },
    { new: true, upsert: true }
  );

  res.json({ success: true, data });
}

// POST /settings/branding/teacher-signature (multipart field: signature)
export async function upsertTeacherSignature(req: Request, res: Response): Promise<void> {
  const teacherId = String(req.body.teacherId ?? '').trim();
  if (!teacherId) {
    res.status(400).json({ success: false, message: 'teacherId is required' });
    return;
  }

  const teacher = await Teacher.findById(teacherId).lean();
  if (!teacher) {
    res.status(404).json({ success: false, message: 'Teacher not found' });
    return;
  }

  const files = (req.files && !Array.isArray(req.files) ? req.files : {}) as Record<string, Express.Multer.File[]>;
  const file = files.signature?.[0];
  if (!file) {
    res.status(400).json({ success: false, message: 'signature image is required' });
    return;
  }

  const signatureUrl = saveUploadedFile(file);
  const existing = await Branding.findOne({ key: BRANDING_KEY });

  if (existing) {
    const current = existing.teacherSignatures ?? [];
    const prev = current.find((s) => s.teacherId === teacherId);
    if (prev?.signatureUrl) deleteSavedFile(prev.signatureUrl);

    const next = [
      ...current.filter((s) => s.teacherId !== teacherId),
      { teacherId, teacherName: teacher.name, signatureUrl },
    ];

    existing.teacherSignatures = next;
    await existing.save();
    res.json({ success: true, data: existing });
    return;
  }

  const created = await Branding.create({
    key: BRANDING_KEY,
    teacherSignatures: [{ teacherId, teacherName: teacher.name, signatureUrl }],
  });

  res.status(201).json({ success: true, data: created });
}

// DELETE /settings/branding/asset/:assetKey
export async function removeBrandingAsset(req: Request, res: Response): Promise<void> {
  const assetKey = String(req.params.assetKey ?? '').trim();
  if (!['logo', 'principalSignature'].includes(assetKey)) {
    res.status(400).json({ success: false, message: 'assetKey must be logo or principalSignature' });
    return;
  }

  const branding = await Branding.findOne({ key: BRANDING_KEY });
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
export async function removeTeacherSignature(req: Request, res: Response): Promise<void> {
  const teacherId = String(req.params.teacherId ?? '').trim();
  if (!teacherId) {
    res.status(400).json({ success: false, message: 'teacherId is required' });
    return;
  }

  const branding = await Branding.findOne({ key: BRANDING_KEY });
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
