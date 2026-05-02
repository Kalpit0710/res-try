import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { Student } from '../models/Student';
import { Class } from '../models/Class';

type MulterRequest = Request & { file?: Express.Multer.File };

function textValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function parseDob(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === '') return undefined;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    // Excel serial date support
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const ms = Math.round(value * 24 * 60 * 60 * 1000);
    const date = new Date(excelEpoch.getTime() + ms);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  const raw = String(value).trim();
  if (!raw) return undefined;

  const normalized = raw.replace(/[.\/]/g, '-');

  // yyyy-mm-dd
  const isoLike = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoLike) {
    const [, yyyy, mm, dd] = isoLike;
    const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  // dd-mm-yyyy or dd-mm-yy
  const dmyLike = normalized.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dmyLike) {
    const [, dd, mm, yy] = dmyLike;
    const yearNum = Number(yy);
    const year = yy.length === 2 ? (yearNum <= 29 ? 2000 + yearNum : 1900 + yearNum) : yearNum;
    const date = new Date(year, Number(mm) - 1, Number(dd));
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

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

  const student = await Student.create({
    regNo,
    name,
    fatherName,
    motherName,
    dob: parseDob(dob),
    classId,
    rollNo,
  });
  res.status(201).json({ success: true, data: student });
}

export async function updateStudent(req: Request, res: Response): Promise<void> {
  const { regNo, name, fatherName, motherName, dob, classId, rollNo } = req.body;
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { regNo, name, fatherName, motherName, dob: parseDob(dob), classId, rollNo },
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
    const regNo = textValue(row.regNo);
    const name = textValue(row.name);
    const className = textValue(row.class);

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
        fatherName: textValue(row.fatherName) || undefined,
        motherName: textValue(row.motherName) || undefined,
        dob: parseDob(row.dob),
        classId,
        rollNo: textValue(row.rollNo) || undefined,
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

// POST /students/bulk-parse (multipart/form-data, field: "file")
export async function parseBulkStudents(req: MulterRequest, res: Response): Promise<void> {
  if (!req.file) { res.status(400).json({ success: false, message: 'No file uploaded' }); return; }

  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

  // Resolve class names to IDs
  const classNames = [...new Set(rows.map(r => r.class?.trim()).filter(Boolean))];
  const classes = await Class.find({ name: { $in: classNames } }).lean();
  const classMap = Object.fromEntries(classes.map(c => [c.name, c._id.toString()]));

  const errors: { row: number; regNo: string; reason: string }[] = [];
  const parsed: Array<Record<string, any>> = [];
  const seenInFile = new Set<string>();

  // Also load existing regNos to flag duplicates in system
  const existingRegs = await Student.find({ regNo: { $in: rows.map(r => textValue(r.regNo)).filter(Boolean) } }).lean();
  const existingSet = new Set(existingRegs.map(e => e.regNo));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const regNo = textValue(row.regNo);
    const name = textValue(row.name);
    const className = textValue(row.class);

    const resultRow: Record<string, any> = {
      __row: i + 2,
      regNo: regNo ?? '',
      name: name ?? '',
      fatherName: textValue(row.fatherName),
      motherName: textValue(row.motherName),
      dob: textValue(row.dob),
      class: className ?? '',
      rollNo: textValue(row.rollNo),
    };

    // Basic validation
    const dob = parseDob(row.dob);

    if (!regNo || !name || !className) {
      errors.push({ row: i + 2, regNo: regNo ?? '', reason: 'Missing required field (regNo, name, class)' });
      resultRow.__valid = false;
      parsed.push(resultRow);
      continue;
    }

    if (row.dob && !dob) {
      errors.push({ row: i + 2, regNo, reason: 'Invalid dob format. Use dd-mm-yyyy, dd/mm/yyyy, or yyyy-mm-dd.' });
      resultRow.__valid = false;
      parsed.push(resultRow);
      continue;
    }

    if (seenInFile.has(regNo)) {
      errors.push({ row: i + 2, regNo, reason: 'Duplicate regNo within file' });
      resultRow.__valid = false;
      parsed.push(resultRow);
      continue;
    }
    seenInFile.add(regNo);

    const classId = classMap[className];
    if (!classId) {
      errors.push({ row: i + 2, regNo, reason: `Class "${className}" not found in system` });
      resultRow.__valid = false;
      parsed.push(resultRow);
      continue;
    }

    if (existingSet.has(regNo)) {
      errors.push({ row: i + 2, regNo, reason: 'regNo already exists in system' });
      resultRow.__valid = false;
      parsed.push(resultRow);
      continue;
    }

    resultRow.__valid = true;
    resultRow.classId = classId;
    resultRow.dob = dob ? dob.toISOString() : '';
    parsed.push(resultRow);
  }

  res.json({ success: true, data: { total: rows.length, parsed, errors } });
}

// POST /students/bulk-commit (json body: { rows: [...] })
export async function commitBulkStudents(req: Request, res: Response): Promise<void> {
  const payload = req.body;
  if (!payload || !Array.isArray(payload.rows)) { res.status(400).json({ success: false, message: 'rows array required' }); return; }

  const rows: Array<any> = payload.rows;
  const succeeded: string[] = [];
  const failed: { index: number; regNo: string; reason: string }[] = [];

  // Resolve classIds if passed as class name
  const classNames = [...new Set(rows.map(r => textValue(r.class)).filter(Boolean))];
  const classes = await Class.find({ name: { $in: classNames } }).lean();
  const classMap = Object.fromEntries(classes.map(c => [c.name, c._id.toString()]));

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const regNo = textValue(r.regNo);
    const name = textValue(r.name);
    const className = textValue(r.class);

    if (!regNo || !name || !className) {
      failed.push({ index: i, regNo, reason: 'Missing required field' });
      continue;
    }

    const classId = r.classId ?? classMap[className];
    if (!classId) { failed.push({ index: i, regNo, reason: `Class "${className}" not found` }); continue; }

    try {
      await Student.create({
        regNo,
        name,
        fatherName: textValue(r.fatherName) || undefined,
        motherName: textValue(r.motherName) || undefined,
        dob: parseDob(r.dob),
        classId,
        rollNo: textValue(r.rollNo) || undefined,
      });
      succeeded.push(regNo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      failed.push({ index: i, regNo, reason: msg.includes('duplicate') ? 'regNo already exists' : msg });
    }
  }

  res.json({ success: true, data: { total: rows.length, succeeded: succeeded.length, failed: failed.length }, errors: failed });
}
