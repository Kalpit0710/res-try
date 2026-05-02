import { Request, Response } from 'express';
import { z } from 'zod';
import { Marks } from '../models/Marks';
import { Subject } from '../models/Subject';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';
import { Log } from '../models/Log';
import { checkLocks } from '../services/lock.service';

const Term1Schema = z
  .object({
    periodicTest: z.number().min(0).optional(),
    notebook: z.number().min(0).optional(),
    subEnrichment: z.number().min(0).optional(),
    halfYearlyExam: z.number().min(0).optional(),
  })
  .partial();

const Term2Schema = z
  .object({
    periodicTest: z.number().min(0).optional(),
    notebook: z.number().min(0).optional(),
    subEnrichment: z.number().min(0).optional(),
    yearlyExam: z.number().min(0).optional(),
  })
  .partial();

const MarksCreateSchema = z.object({
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  teacherName: z.string().trim().min(1),
  term1: Term1Schema.optional(),
  term2: Term2Schema.optional(),
});

const MarksUpdateSchema = z.object({
  teacherName: z.string().trim().min(1),
  term1: Term1Schema.optional(),
  term2: Term2Schema.optional(),
});

function assertWithinMax(params: {
  term1?: Record<string, number | undefined>;
  term2?: Record<string, number | undefined>;
  maxMarks: { term1: Record<string, number>; term2: Record<string, number> };
}): string | null {
  if (params.term1) {
    for (const [k, v] of Object.entries(params.term1)) {
      if (v == null) continue;
      const max = params.maxMarks.term1[k];
      if (typeof max === 'number' && v > max) return `term1.${k} exceeds max (${max})`;
    }
  }
  if (params.term2) {
    for (const [k, v] of Object.entries(params.term2)) {
      if (v == null) continue;
      const max = params.maxMarks.term2[k];
      if (typeof max === 'number' && v > max) return `term2.${k} exceeds max (${max})`;
    }
  }
  return null;
}

// GET /marks?studentId=&subjectId=
export async function getMarks(req: Request, res: Response): Promise<void> {
  const { studentId, subjectId } = req.query as Record<string, string>;
  const query: Record<string, unknown> = {};
  if (studentId) query.studentId = studentId;
  if (subjectId) query.subjectId = subjectId;

  const marks = await Marks.find(query)
    .populate('studentId', 'name regNo classId rollNo')
    .populate('subjectId', 'name classId maxMarks')
    .sort({ updatedAt: -1 })
    .lean();

  res.json({ success: true, data: marks });
}

// POST /marks
export async function createMarks(req: Request, res: Response): Promise<void> {
  const parsed = MarksCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Invalid body' });
    return;
  }

  const { studentId, subjectId, teacherName, term1, term2 } = parsed.data;

  const [student, subject, teacher] = await Promise.all([
    Student.findById(studentId).lean(),
    Subject.findById(subjectId).lean(),
    Teacher.findOne({ name: teacherName }).lean(),
  ]);

  if (!student) {
    res.status(404).json({ success: false, message: 'Student not found' });
    return;
  }
  if (!subject) {
    res.status(404).json({ success: false, message: 'Subject not found' });
    return;
  }
  if (!teacher) {
    res.status(400).json({ success: false, message: 'Teacher not found' });
    return;
  }

  const lock = await checkLocks({
    studentId,
    classId: student.classId.toString(),
    teacherReference: teacherName,
  });
  if (lock.locked) {
    res.status(403).json({ success: false, message: lock.reason });
    return;
  }

  const maxError = assertWithinMax({ term1, term2, maxMarks: subject.maxMarks as any });
  if (maxError) {
    res.status(400).json({ success: false, message: maxError });
    return;
  }

  const doc = await Marks.findOneAndUpdate(
    { studentId, subjectId },
    { $set: { teacherName, term1: term1 ?? {}, term2: term2 ?? {} } },
    { new: true, upsert: true, runValidators: true }
  );

  await Log.create({
    teacherName,
    action: 'marks_saved',
    studentId,
    subjectId,
  });

  res.status(201).json({ success: true, data: doc });
}

// PUT /marks/:id
export async function updateMarks(req: Request, res: Response): Promise<void> {
  const parsed = MarksUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Invalid body' });
    return;
  }

  const existing = await Marks.findById(req.params.id).lean();
  if (!existing) {
    res.status(404).json({ success: false, message: 'Marks entry not found' });
    return;
  }

  const { teacherName, term1, term2 } = parsed.data;

  const [student, subject, teacher] = await Promise.all([
    Student.findById(existing.studentId).lean(),
    Subject.findById(existing.subjectId).lean(),
    Teacher.findOne({ name: teacherName }).lean(),
  ]);

  if (!student || !subject) {
    res.status(400).json({ success: false, message: 'Invalid student/subject reference' });
    return;
  }
  if (!teacher) {
    res.status(400).json({ success: false, message: 'Teacher not found' });
    return;
  }

  const lock = await checkLocks({
    studentId: student._id.toString(),
    classId: student.classId.toString(),
    teacherReference: teacherName,
  });
  if (lock.locked) {
    res.status(403).json({ success: false, message: lock.reason });
    return;
  }

  const mergedTerm1 = { ...(existing.term1 as any), ...(term1 ?? {}) };
  const mergedTerm2 = { ...(existing.term2 as any), ...(term2 ?? {}) };

  const maxError = assertWithinMax({ term1: mergedTerm1, term2: mergedTerm2, maxMarks: subject.maxMarks as any });
  if (maxError) {
    res.status(400).json({ success: false, message: maxError });
    return;
  }

  const doc = await Marks.findByIdAndUpdate(
    req.params.id,
    { $set: { teacherName, term1: mergedTerm1, term2: mergedTerm2 } },
    { new: true, runValidators: true }
  );

  await Log.create({
    teacherName,
    action: 'marks_updated',
    studentId: student._id,
    subjectId: subject._id,
  });

  res.json({ success: true, data: doc });
}
