import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { Student } from '../models/Student';
import { Class } from '../models/Class';

type MulterRequest = Request & { file?: Express.Multer.File };

// GET /students?search=&classId=&page=&limit=
export async function getStudents(req: Request, res: Response): Promise<void> {
  const { search, classId, page = '1', limit = '20' } = req.query as Record<string, string>;
  const query: Record<string, unknown> = {};

  if (classId) query.classId = classId;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { regNo: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [data, total] = await Promise.all([
    Student.find(query).populate('classId', 'name').skip(skip).limit(parseInt(limit)).lean(),
    Student.countDocuments(query),
  ]);

  res.json({ success: true, data, total, page: parseInt(page), limit: parseInt(limit) });
}

export async function getStudentById(req: Request, res: Response): Promise<void> {
  const student = await Student.findById(req.params.id).populate('classId', 'name').lean();
  if (!student) { res.status(404).json({ success: false, message: 'Student not found' }); return; }
  res.json({ success: true, data: student });
}

export async function createStudent(req: Request, res: Response): Promise<void> {
  const { regNo, name, fatherName, motherName, dob, classId, rollNo } = req.body;
  if (!regNo || !name || !classId) {
    res.status(400).json({ success: false, message: 'regNo, name, and classId are required' });
    return;
  }
  const existing = await Student.findOne({ regNo });
  if (existing) { res.status(409).json({ success: false, message: `regNo "${regNo}" already exists` }); return; }

  const student = await Student.create({ regNo, name, fatherName, motherName, dob, classId, rollNo });
  res.status(201).json({ success: true, data: student });
}

export async function updateStudent(req: Request, res: Response): Promise<void> {
  const { regNo, name, fatherName, motherName, dob, classId, rollNo } = req.body;
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { regNo, name, fatherName, motherName, dob, classId, rollNo },
    { new: true, runValidators: true }
  );
  if (!student) { res.status(404).json({ success: false, message: 'Student not found' }); return; }
  res.json({ success: true, data: student });
}

export async function deleteStudent(req: Request, res: Response): Promise<void> {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) { res.status(404).json({ success: false, message: 'Student not found' }); return; }
  res.json({ success: true, message: 'Student deleted' });
}

// POST /students/bulk-upload (multipart/form-data, field: "file")
export async function bulkUploadStudents(req: MulterRequest, res: Response): Promise<void> {
  if (!req.file) { res.status(400).json({ success: false, message: 'No file uploaded' }); return; }

  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

  // Resolve class names to IDs
  const classNames = [...new Set(rows.map(r => r.class?.trim()).filter(Boolean))];
  const classes = await Class.find({ name: { $in: classNames } }).lean();
  const classMap = Object.fromEntries(classes.map(c => [c.name, c._id.toString()]));

  const succeeded: string[] = [];
  const failed: { row: number; regNo: string; reason: string }[] = [];
  const seenInFile = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const regNo = row.regNo?.trim();
    const name = row.name?.trim();
    const className = row.class?.trim();

    if (!regNo || !name || !className) {
      failed.push({ row: i + 2, regNo: regNo ?? '', reason: 'Missing required field (regNo, name, class)' });
      continue;
    }
    if (seenInFile.has(regNo)) {
      failed.push({ row: i + 2, regNo, reason: 'Duplicate regNo within file' });
      continue;
    }
    seenInFile.add(regNo);

    const classId = classMap[className];
    if (!classId) {
      failed.push({ row: i + 2, regNo, reason: `Class "${className}" not found in system` });
      continue;
    }

    try {
      await Student.create({
        regNo,
        name,
        fatherName: row.fatherName?.trim(),
        motherName: row.motherName?.trim(),
        dob: row.dob ? new Date(row.dob) : undefined,
        classId,
        rollNo: row.rollNo?.trim(),
      });
      succeeded.push(regNo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      failed.push({ row: i + 2, regNo, reason: msg.includes('duplicate') ? 'regNo already exists in system' : msg });
    }
  }

  res.json({
    success: true,
    data: { total: rows.length, succeeded: succeeded.length, failed: failed.length },
    errors: failed,
  });
}
