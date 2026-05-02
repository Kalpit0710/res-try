import { Request, Response } from 'express';
import { Class } from '../models/Class';
import { Student } from '../models/Student';
import { Subject } from '../models/Subject';
import { Teacher } from '../models/Teacher';

export async function getPublicClasses(_req: Request, res: Response): Promise<void> {
  const classes = await Class.find().sort({ name: 1 }).lean();
  res.json({ success: true, data: classes });
}

export async function getPublicStudents(req: Request, res: Response): Promise<void> {
  const { classId, search = '' } = req.query as Record<string, string>;
  const query: Record<string, unknown> = {};

  if (classId) query.classId = classId;
  if (search.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { regNo: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const students = await Student.find(query).populate('classId', 'name').sort({ name: 1 }).lean();
  res.json({ success: true, data: students });
}

export async function getPublicSubjects(req: Request, res: Response): Promise<void> {
  const { classId } = req.query as Record<string, string>;
  const query: Record<string, unknown> = {};
  if (classId) query.classId = classId;

  const subjects = await Subject.find(query).sort({ name: 1 }).lean();
  res.json({ success: true, data: subjects });
}

export async function getPublicTeachers(_req: Request, res: Response): Promise<void> {
  const teachers = await Teacher.find().sort({ name: 1 }).lean();
  res.json({ success: true, data: teachers });
}
