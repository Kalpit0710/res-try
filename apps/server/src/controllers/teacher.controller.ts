import { Request, Response } from 'express';
import { z } from 'zod';
import { Teacher } from '../models/Teacher';

const TeacherCreateSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  classId: z.string().min(1, 'classId is required').optional().nullable(),
});

const TeacherUpdateSchema = z.object({
  name: z.string().trim().min(1, 'name is required').optional(),
  classId: z.string().min(1, 'classId is required').optional().nullable(),
});

export async function getTeachers(_req: Request, res: Response): Promise<void> {
  const teachers = await Teacher.find().populate('classId', 'name').sort({ name: 1 }).lean();
  res.json({ success: true, data: teachers });
}

export async function getTeacherById(req: Request, res: Response): Promise<void> {
  const teacher = await Teacher.findById(req.params.id).populate('classId', 'name').lean();
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

  const { name, classId } = parsed.data;
  
  // Validate classId if provided
  if (classId) {
    const { Class } = await import('../models/Class');
    const classExists = await Class.findById(classId).lean();
    if (!classExists) {
      res.status(404).json({ success: false, message: 'Class not found' });
      return;
    }
  }

  const teacher = await Teacher.create({
    name,
    ...(classId && { classId }),
  });
  
  await teacher.populate('classId', 'name');
  res.status(201).json({ success: true, data: teacher });
}

export async function updateTeacher(req: Request, res: Response): Promise<void> {
  const parsed = TeacherUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Invalid body' });
    return;
  }

  const { name, classId } = parsed.data;
  const updateData: Record<string, any> = {};
  
  if (name !== undefined) {
    updateData.name = name;
  }
  
  if (classId !== undefined) {
    if (classId) {
      const { Class } = await import('../models/Class');
      const classExists = await Class.findById(classId).lean();
      if (!classExists) {
        res.status(404).json({ success: false, message: 'Class not found' });
        return;
      }
      updateData.classId = classId;
    } else {
      updateData.classId = null;
    }
  }

  const teacher = await Teacher.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
    .populate('classId', 'name');
  
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
