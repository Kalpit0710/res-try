import { Request, Response } from 'express';
import { z } from 'zod';
import { Lock } from '../models/Lock';

const LockCreateSchema = z.object({
  type: z.enum(['system', 'class', 'student', 'teacher']),
  referenceId: z.string().trim().min(1, 'referenceId is required'),
  isLocked: z.boolean().optional(),
});

const LockUpdateSchema = z.object({
  isLocked: z.boolean(),
});

export async function getLocks(req: Request, res: Response): Promise<void> {
  const { type, referenceId } = req.query as Record<string, string>;
  const query: Record<string, unknown> = {};
  if (type) query.type = type;
  if (referenceId) query.referenceId = referenceId;

  const locks = await Lock.find(query).sort({ updatedAt: -1 }).lean();
  res.json({ success: true, data: locks });
}

export async function createLock(req: Request, res: Response): Promise<void> {
  const parsed = LockCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Invalid body' });
    return;
  }

  const doc = await Lock.findOneAndUpdate(
    { type: parsed.data.type, referenceId: parsed.data.referenceId },
    { $set: { isLocked: parsed.data.isLocked ?? true } },
    { new: true, upsert: true }
  );

  res.status(201).json({ success: true, data: doc });
}

export async function updateLock(req: Request, res: Response): Promise<void> {
  const parsed = LockUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Invalid body' });
    return;
  }

  const doc = await Lock.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true });
  if (!doc) {
    res.status(404).json({ success: false, message: 'Lock not found' });
    return;
  }

  res.json({ success: true, data: doc });
}

export async function deleteLock(req: Request, res: Response): Promise<void> {
  const doc = await Lock.findByIdAndDelete(req.params.id);
  if (!doc) {
    res.status(404).json({ success: false, message: 'Lock not found' });
    return;
  }

  res.json({ success: true, message: 'Lock deleted' });
}
