import { Request, Response } from 'express';
import { Class } from '../models/Class';
import { Student } from '../models/Student';
import { Subject } from '../models/Subject';
import { Teacher } from '../models/Teacher';
import { Types } from 'mongoose';
import { LowerClassSubject } from '../models/LowerClassSubject';

const SUBJECT_ORDER = [
  'english',
  'hindi',
  'mathematics',
  'science',
  'social studies',
  'sanskrit',
  'general knowledge',
  'computer'
];

function sortSubjects(a: any, b: any) {
  const aName = (a.name || '').toLowerCase().trim();
  const bName = (b.name || '').toLowerCase().trim();
  let aIndex = SUBJECT_ORDER.indexOf(aName);
  let bIndex = SUBJECT_ORDER.indexOf(bName);
  if (aIndex === -1) aIndex = 999;
  if (bIndex === -1) bIndex = 999;
  if (aIndex === bIndex) return a.name.localeCompare(b.name);
  return aIndex - bIndex;
}

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
    const [standardSubjects, lowerSubjects] = await Promise.all([
      Subject.find().sort({ name: 1 }).lean(),
      LowerClassSubject.find().sort({ order: 1, name: 1 }).lean()
    ]);
    const subjects = [...standardSubjects, ...lowerSubjects].sort(sortSubjects);
    res.json({ success: true, data: subjects });
    return;
  }

  if (!Types.ObjectId.isValid(classId)) {
    res.json({ success: true, data: [] });
    return;
  }

  const cls = await Class.findById(classId).select('subjects reportCardType').lean();
  
  if (cls?.reportCardType === 'lowerClass') {
    const subjects = await LowerClassSubject.find({ classId }).sort({ order: 1, name: 1 }).lean();
    res.json({ success: true, data: subjects });
    return;
  }

  const filterOutValueEducation = (s: any) => s.name.toLowerCase().trim() !== 'value education';

  const directSubjects = (await Subject.find({ classId }).sort({ name: 1 }).lean()).filter(filterOutValueEducation);

  if (!cls?.subjects?.length) {
    res.json({ success: true, data: directSubjects });
    return;
  }

  const linkedSubjects = (await Subject.find({ _id: { $in: cls.subjects } }).sort({ name: 1 }).lean()).filter(filterOutValueEducation);
  const mergedById = new Map<string, (typeof linkedSubjects)[number]>();
  for (const subject of directSubjects) mergedById.set(String(subject._id), subject);
  for (const subject of linkedSubjects) mergedById.set(String(subject._id), subject);

  const subjects = Array.from(mergedById.values()).sort(sortSubjects);
  res.json({ success: true, data: subjects });
}

export async function getPublicTeachers(_req: Request, res: Response): Promise<void> {
  const teachers = await Teacher.find().sort({ name: 1 }).lean();
  res.json({ success: true, data: teachers });
}
