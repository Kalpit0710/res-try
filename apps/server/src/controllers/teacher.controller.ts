import { Request, Response } from 'express';
import { z } from 'zod';
import { Teacher } from '../models/Teacher';

const TeacherCreateSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
});

const TeacherUpdateSchema = z.object({
  name: z.string().trim().min(1, 'name is required').optional(),
});

export async function getTeachers(_req: Request, res: Response): Promise<void> {
  const teachers = await Teacher.find().sort({ name: 1 }).lean();
  res.json({ success: true, data: teachers });
}

export async function getTeacherById(req: Request, res: Response): Promise<void> {
  const teacher = await Teacher.findById(req.params.id).lean();
  if (!teacher) {
    res.status(404).json({ success: false, message: 'Teacher not found' });
    return;
  }
  res.json({ success: true, data: teacher });
}

export async function createTeacher(req: Request, res: Response): Promise<void> {
  const parsed = TeacherCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Invalid body' });
    return;
  }

  const teacher = await Teacher.create(parsed.data);
  res.status(201).json({ success: true, data: teacher });
}

export async function updateTeacher(req: Request, res: Response): Promise<void> {
  const parsed = TeacherUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Invalid body' });
    return;
  }

  const teacher = await Teacher.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true });
  if (!teacher) {
    res.status(404).json({ success: false, message: 'Teacher not found' });
    return;
  }

  res.json({ success: true, data: teacher });
}

export async function deleteTeacher(req: Request, res: Response): Promise<void> {
  const teacher = await Teacher.findByIdAndDelete(req.params.id);
  if (!teacher) {
    res.status(404).json({ success: false, message: 'Teacher not found' });
    return;
  }

  res.json({ success: true, message: 'Teacher deleted' });
}
