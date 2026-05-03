import { Request, Response } from 'express';
import { Class } from '../models/Class';
import { Student } from '../models/Student';
import { Subject } from '../models/Subject';
import { Teacher } from '../models/Teacher';
import { Types } from 'mongoose';

export async function getPublicClasses(_req: Request, res: Response): Promise<void> {
  const classes = await Class.find().sort({ name: 1 }).lean();
  res.json({ success: true, data: classes });
}

export async function getPublicStudents(req: Request, res: Response): Promise<void> {
  const { classId, search = '' } = req.query as Record<string, string>;
  const query: Record<string, unknown> = {};

  if (classId) {
    if (!Types.ObjectId.isValid(classId)) {
      res.json({ success: true, data: [] });
      return;
    }
    query.classId = classId;
  }
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

  if (!classId) {
    const subjects = await Subject.find().sort({ name: 1 }).lean();
    res.json({ success: true, data: subjects });
    return;
  }

  if (!Types.ObjectId.isValid(classId)) {
    res.json({ success: true, data: [] });
    return;
  }

  const [directSubjects, cls] = await Promise.all([
    Subject.find({ classId }).sort({ name: 1 }).lean(),
    Class.findById(classId).select('subjects').lean(),
  ]);

  if (!cls?.subjects?.length) {
    res.json({ success: true, data: directSubjects });
    return;
  }

  const linkedSubjects = await Subject.find({ _id: { $in: cls.subjects } }).sort({ name: 1 }).lean();
  const mergedById = new Map<string, (typeof linkedSubjects)[number]>();
  for (const subject of directSubjects) mergedById.set(String(subject._id), subject);
  for (const subject of linkedSubjects) mergedById.set(String(subject._id), subject);

  const subjects = Array.from(mergedById.values()).sort((a, b) => a.name.localeCompare(b.name));
  res.json({ success: true, data: subjects });
}

export async function getPublicTeachers(_req: Request, res: Response): Promise<void> {
  const teachers = await Teacher.find().sort({ name: 1 }).lean();
  res.json({ success: true, data: teachers });
}
