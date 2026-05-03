import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { Student } from '../models/Student';
import { Class } from '../models/Class';
import { Subject } from '../models/Subject';
import { Marks } from '../models/Marks';
import { Teacher } from '../models/Teacher';
import { Log } from '../models/Log';
import { checkLocks } from '../services/lock.service';

type MulterRequest = Request & { file?: Express.Multer.File };

type SubjectMaxMarks = {
  term1: { periodicTest: number; notebook: number; subEnrichment: number; halfYearlyExam: number };
  term2: { periodicTest: number; notebook: number; subEnrichment: number; yearlyExam: number };
};

type PartialTerm1 = {
  periodicTest?: number;
  notebook?: number;
  subEnrichment?: number;
  halfYearlyExam?: number;
};

type PartialTerm2 = {
  periodicTest?: number;
  notebook?: number;
  subEnrichment?: number;
  yearlyExam?: number;
};

type SubjectRowMarks = {
  term1?: PartialTerm1;
  term2?: PartialTerm2;
};

type ParsedImportRow = {
  rowNumber: number;
  regNo: string;
  name: string;
  className: string;
  studentId: string;
  hasChanges: boolean;
  changedCells: number;
  marksBySubject: Record<string, SubjectRowMarks>;
};

const ImportBodySchema = z.object({
  classId: z.string().min(1),
  teacherName: z.string().trim().min(1),
  rows: z.array(
    z.object({
      rowNumber: z.number().int().positive(),
      regNo: z.string().trim().min(1),
      name: z.string().trim().min(1),
      className: z.string().trim().min(1),
      studentId: z.string().trim().min(1),
      hasChanges: z.boolean(),
      changedCells: z.number().int().min(0),
      marksBySubject: z.record(
        z.object({
          term1: z
            .object({
              periodicTest: z.number().min(0).optional(),
              notebook: z.number().min(0).optional(),
              subEnrichment: z.number().min(0).optional(),
              halfYearlyExam: z.number().min(0).optional(),
            })
            .partial()
            .optional(),
          term2: z
            .object({
              periodicTest: z.number().min(0).optional(),
              notebook: z.number().min(0).optional(),
              subEnrichment: z.number().min(0).optional(),
              yearlyExam: z.number().min(0).optional(),
            })
            .partial()
            .optional(),
        })
      ),
    })
  ),
});

const identityUnsafePrefix = /^[=+\-@]/;

function normalizeText(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function normalizeComparable(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function toSafeSheetName(value: string): string {
  const sanitized = value.replace(/[\\/?*\[\]:]/g, '_').trim();
  return (sanitized || 'Class').slice(0, 31);
}

function numberOrUndefined(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return undefined;
    return value;
  }

  const text = String(value).trim();
  if (!text) return undefined;
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

function validateIdentityCell(value: unknown): string {
  const normalized = normalizeText(value);
  if (!normalized) return '';
  if (identityUnsafePrefix.test(normalized)) return '';
  return normalized;
}

function assertWithinMax(params: { term1?: PartialTerm1; term2?: PartialTerm2; maxMarks: SubjectMaxMarks }): string | null {
  if (params.term1) {
    for (const [k, v] of Object.entries(params.term1)) {
      if (v == null) continue;
      const max = (params.maxMarks.term1 as Record<string, number>)[k];
      if (typeof max === 'number' && v > max) return `term1.${k} exceeds max (${max})`;
    }
  }

  if (params.term2) {
    for (const [k, v] of Object.entries(params.term2)) {
      if (v == null) continue;
      const max = (params.maxMarks.term2 as Record<string, number>)[k];
      if (typeof max === 'number' && v > max) return `term2.${k} exceeds max (${max})`;
    }
  }

  return null;
}

function hasAnyMarksInput(value: SubjectRowMarks): boolean {
  const term1 = value.term1 ?? {};
  const term2 = value.term2 ?? {};
  return (
    term1.periodicTest !== undefined ||
    term1.notebook !== undefined ||
    term1.subEnrichment !== undefined ||
    term1.halfYearlyExam !== undefined ||
    term2.periodicTest !== undefined ||
    term2.notebook !== undefined ||
    term2.subEnrichment !== undefined ||
    term2.yearlyExam !== undefined
  );
}

async function getClassContext(classId: string) {
  const classDoc = await Class.findById(classId).lean();
  if (!classDoc) return null;

  const students = await Student.find({ classId }).sort({ rollNo: 1, name: 1 }).lean();

  const classSubjectIds = (classDoc.subjects ?? []).map((id) => id.toString());
  const allSubjects = await Subject.find({ classId }).lean();
  const subjectMap = new Map(allSubjects.map((s) => [s._id.toString(), s]));

  const orderedSubjects = [
    ...classSubjectIds.map((id) => subjectMap.get(id)).filter((value): value is NonNullable<typeof value> => Boolean(value)),
    ...allSubjects.filter((s) => !classSubjectIds.includes(s._id.toString())),
  ];

  const studentIds = students.map((s) => s._id);
  const subjectIds = orderedSubjects.map((s) => s._id);
  const marksDocs = await Marks.find({ studentId: { $in: studentIds }, subjectId: { $in: subjectIds } }).lean();

  return {
    classDoc,
    students,
    subjects: orderedSubjects,
    marksDocs,
  };
}

export async function downloadMarksExcelTemplate(req: Request, res: Response): Promise<void> {
  // If classId is provided -> single-sheet for that class.
  // If missing or classId === 'all' -> generate workbook with sheets for all classes.
  const rawClassId = normalizeText(req.query.classId);
  const generateAll = !rawClassId || rawClassId.toLowerCase() === 'all';

  const classIdsToExport: string[] = [];
  if (generateAll) {
    const allClasses = await Class.find({}).lean();
    if (allClasses.length === 0) {
      res.status(400).json({ success: false, message: 'No classes found to export' });
      return;
    }
    for (const c of allClasses) classIdsToExport.push(String(c._id));
  } else {
    classIdsToExport.push(rawClassId);
  }

  const workbook = XLSX.utils.book_new();

  for (const cid of classIdsToExport) {
    const context = await getClassContext(cid);
    if (!context) continue; // skip missing/empty classes

    const { classDoc, students, subjects, marksDocs } = context;
    if (subjects.length === 0) continue;

    const marksMap = new Map<string, any>();
    for (const item of marksDocs) {
      const key = `${item.studentId.toString()}::${item.subjectId.toString()}`;
      marksMap.set(key, item);
    }

    const row1: Array<string | number | null> = ['Name', 'Reg. No', 'Class'];
    const row2: Array<string | number | null> = ['', '', ''];
    const row3: Array<string | number | null> = ['', '', ''];
    const row4: Array<string | number | null> = ['', '', ''];
    const merges: XLSX.Range[] = [
      { s: { r: 0, c: 0 }, e: { r: 3, c: 0 } },
      { s: { r: 0, c: 1 }, e: { r: 3, c: 1 } },
      { s: { r: 0, c: 2 }, e: { r: 3, c: 2 } },
    ];

    for (let subjectIndex = 0; subjectIndex < subjects.length; subjectIndex += 1) {
      const subject = subjects[subjectIndex];
      const startCol = 3 + subjectIndex * 8;

      row1.push(subject.name, '', '', '', '', '', '', '');
      row2.push('Term 1', '', '', '', 'Term 2', '', '', '');
      row3.push('Periodic Test', 'Notebook', 'Subject Enrichment', 'Half Yearly', 'Periodic Test', 'Notebook', 'Subject Enrichment', 'Yearly');
      row4.push(
        Number(subject.maxMarks?.term1?.periodicTest ?? 10),
        Number(subject.maxMarks?.term1?.notebook ?? 5),
        Number(subject.maxMarks?.term1?.subEnrichment ?? 5),
        Number(subject.maxMarks?.term1?.halfYearlyExam ?? 30),
        Number(subject.maxMarks?.term2?.periodicTest ?? 10),
        Number(subject.maxMarks?.term2?.notebook ?? 5),
        Number(subject.maxMarks?.term2?.subEnrichment ?? 5),
        Number(subject.maxMarks?.term2?.yearlyExam ?? 30)
      );

      merges.push({ s: { r: 0, c: startCol }, e: { r: 0, c: startCol + 7 } });
      merges.push({ s: { r: 1, c: startCol }, e: { r: 1, c: startCol + 3 } });
      merges.push({ s: { r: 1, c: startCol + 4 }, e: { r: 1, c: startCol + 7 } });
    }

    const aoa: Array<Array<string | number | null>> = [row1, row2, row3, row4];

    for (const student of students) {
      const dataRow: Array<string | number | null> = [student.name, student.regNo, classDoc.name];

      for (const subject of subjects) {
        const key = `${student._id.toString()}::${subject._id.toString()}`;
        const existing = marksMap.get(key);
        dataRow.push(
          existing?.term1?.periodicTest ?? '',
          existing?.term1?.notebook ?? '',
          existing?.term1?.subEnrichment ?? '',
          existing?.term1?.halfYearlyExam ?? '',
          existing?.term2?.periodicTest ?? '',
          existing?.term2?.notebook ?? '',
          existing?.term2?.subEnrichment ?? '',
          existing?.term2?.yearlyExam ?? ''
        );
      }

      aoa.push(dataRow);
    }

    const sheet = XLSX.utils.aoa_to_sheet(aoa);
    sheet['!merges'] = merges;
    sheet['!cols'] = [
      { wch: 22 },
      { wch: 12 },
      { wch: 14 },
      ...Array.from({ length: subjects.length * 8 }, () => ({ wch: 14 })),
    ];

    // Apply simple styling to header rows and identity columns
    try {
      const setCellStyle = (r: number, c: number, style: any) => {
        const ref = XLSX.utils.encode_cell({ r, c });
        const cell = sheet[ref] ?? { t: 's', v: '' };
        cell.s = { ...(cell.s ?? {}), ...style };
        sheet[ref] = cell;
      };

      // Identity columns (A-C) orange background
      const idStyle = { fill: { fgColor: { rgb: 'FFD8B5' } }, font: { bold: true } };
      for (let r = 0; r < 4; r += 1) {
        for (let c = 0; c < 3; c += 1) setCellStyle(r, c, idStyle);
      }

      // Subject header row background (row 0 merged cells) and term backgrounds
      const term1Style = { fill: { fgColor: { rgb: 'FFF7D6' } }, font: { bold: true } };
      const term2Style = { fill: { fgColor: { rgb: 'DFF3E6' } }, font: { bold: true } };

      for (let si = 0; si < subjects.length; si += 1) {
        const base = 3 + si * 8;
        // subject name cell (merged) - set first cell style
        setCellStyle(0, base, { font: { bold: true } });

        // term1 cells (row1 cols base..base+3)
        for (let c = base; c < base + 4; c += 1) setCellStyle(1, c, term1Style);
        for (let c = base; c < base + 4; c += 1) setCellStyle(2, c, { font: { bold: false } });

        // term2 cells (row1 cols base+4..base+7)
        for (let c = base + 4; c < base + 8; c += 1) setCellStyle(1, c, term2Style);
        for (let c = base + 4; c < base + 8; c += 1) setCellStyle(2, c, { font: { bold: false } });
      }
    } catch (e) {
      // Styling is optional — ignore if sheetjs environment doesn't support styles in this build
      void e;
    }

    XLSX.utils.book_append_sheet(workbook, sheet, toSafeSheetName(classDoc.name));
  }

  const fileName = generateAll ? 'all-classes-marks-template.xlsx' : `${toSafeSheetName((await Class.findById(classIdsToExport[0]).lean())?.name ?? 'class')}-marks-template.xlsx`;
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(buffer);
}

function parseTemplateRows(params: {
  rows: unknown[][];
  className: string;
  studentsByRegNo: Map<string, { _id: unknown; name: string; regNo: string }>;
  marksByStudentAndSubject: Map<string, any>;
  subjects: Array<{ _id: unknown; name: string; maxMarks: SubjectMaxMarks }>;
}): { parsed: ParsedImportRow[]; errors: Array<{ row: number; regNo: string; reason: string }> } {
  const { rows, className, studentsByRegNo, marksByStudentAndSubject, subjects } = params;
  const parsed: ParsedImportRow[] = [];
  const errors: Array<{ row: number; regNo: string; reason: string }> = [];

  const seenRegNo = new Set<string>();

  for (let index = 4; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const rowNumber = index + 1;

    const rawName = validateIdentityCell(row[0]);
    const rawRegNo = validateIdentityCell(row[1]);
    const rawClassName = validateIdentityCell(row[2]);

    if (!rawName && !rawRegNo && !rawClassName) {
      continue;
    }

    if (!rawRegNo) {
      errors.push({ row: rowNumber, regNo: '', reason: 'Reg. No is required' });
      continue;
    }

    if (seenRegNo.has(rawRegNo)) {
      errors.push({ row: rowNumber, regNo: rawRegNo, reason: 'Duplicate Reg. No in uploaded file' });
      continue;
    }
    seenRegNo.add(rawRegNo);

    const student = studentsByRegNo.get(rawRegNo);
    if (!student) {
      errors.push({ row: rowNumber, regNo: rawRegNo, reason: 'Reg. No not found in selected class' });
      continue;
    }

    const nameMismatch = normalizeComparable(rawName) !== normalizeComparable(student.name);
    if (nameMismatch) {
      errors.push({ row: rowNumber, regNo: rawRegNo, reason: `Name mismatch. Expected "${student.name}"` });
      continue;
    }

    const classMismatch = normalizeComparable(rawClassName) !== normalizeComparable(className);
    if (classMismatch) {
      errors.push({ row: rowNumber, regNo: rawRegNo, reason: `Class mismatch. Expected "${className}"` });
      continue;
    }

    const studentId = String(student._id);
    const marksBySubject: Record<string, SubjectRowMarks> = {};
    let changedCells = 0;

    let rowInvalid = false;
    let invalidReason = '';

    for (let subjectIndex = 0; subjectIndex < subjects.length; subjectIndex += 1) {
      const subject = subjects[subjectIndex];
      const baseCol = 3 + subjectIndex * 8;

      const t1Periodic = numberOrUndefined(row[baseCol + 0]);
      const t1Notebook = numberOrUndefined(row[baseCol + 1]);
      const t1SubEnrichment = numberOrUndefined(row[baseCol + 2]);
      const t1HalfYearly = numberOrUndefined(row[baseCol + 3]);
      const t2Periodic = numberOrUndefined(row[baseCol + 4]);
      const t2Notebook = numberOrUndefined(row[baseCol + 5]);
      const t2SubEnrichment = numberOrUndefined(row[baseCol + 6]);
      const t2Yearly = numberOrUndefined(row[baseCol + 7]);

      const valuesToValidate = [
        row[baseCol + 0],
        row[baseCol + 1],
        row[baseCol + 2],
        row[baseCol + 3],
        row[baseCol + 4],
        row[baseCol + 5],
        row[baseCol + 6],
        row[baseCol + 7],
      ];

      for (const rawCell of valuesToValidate) {
        const cellText = normalizeText(rawCell);
        if (cellText && numberOrUndefined(rawCell) === undefined) {
          rowInvalid = true;
          invalidReason = `Invalid marks value in subject "${subject.name}"`; 
          break;
        }
      }

      if (rowInvalid) break;

      const incoming: SubjectRowMarks = {
        term1: {
          periodicTest: t1Periodic,
          notebook: t1Notebook,
          subEnrichment: t1SubEnrichment,
          halfYearlyExam: t1HalfYearly,
        },
        term2: {
          periodicTest: t2Periodic,
          notebook: t2Notebook,
          subEnrichment: t2SubEnrichment,
          yearlyExam: t2Yearly,
        },
      };

      const maxError = assertWithinMax({
        term1: incoming.term1,
        term2: incoming.term2,
        maxMarks: subject.maxMarks,
      });
      if (maxError) {
        rowInvalid = true;
        invalidReason = `${subject.name}: ${maxError}`;
        break;
      }

      if (!hasAnyMarksInput(incoming)) {
        continue;
      }

      const existing = marksByStudentAndSubject.get(`${studentId}::${String(subject._id)}`);
      const changedChecks: Array<[number | undefined, number | undefined]> = [
        [incoming.term1?.periodicTest, existing?.term1?.periodicTest],
        [incoming.term1?.notebook, existing?.term1?.notebook],
        [incoming.term1?.subEnrichment, existing?.term1?.subEnrichment],
        [incoming.term1?.halfYearlyExam, existing?.term1?.halfYearlyExam],
        [incoming.term2?.periodicTest, existing?.term2?.periodicTest],
        [incoming.term2?.notebook, existing?.term2?.notebook],
        [incoming.term2?.subEnrichment, existing?.term2?.subEnrichment],
        [incoming.term2?.yearlyExam, existing?.term2?.yearlyExam],
      ];

      for (const [a, b] of changedChecks) {
        if (a !== undefined && Number(a) !== Number(b ?? NaN)) changedCells += 1;
      }

      marksBySubject[String(subject._id)] = incoming;
    }

    if (rowInvalid) {
      errors.push({ row: rowNumber, regNo: rawRegNo, reason: invalidReason || 'Invalid row data' });
      continue;
    }

    parsed.push({
      rowNumber,
      regNo: rawRegNo,
      name: student.name,
      className,
      studentId,
      hasChanges: changedCells > 0,
      changedCells,
      marksBySubject,
    });
  }

  return { parsed, errors };
}

export async function parseMarksExcel(req: MulterRequest, res: Response): Promise<void> {
  const classId = normalizeText(req.body?.classId);
  if (!classId) {
    res.status(400).json({ success: false, message: 'classId is required' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded' });
    return;
  }

  const context = await getClassContext(classId);
  if (!context) {
    res.status(404).json({ success: false, message: 'Class not found' });
    return;
  }

  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  if (!sheet) {
    res.status(400).json({ success: false, message: 'Uploaded workbook has no readable sheet' });
    return;
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: '' });

  if (rows.length < 5) {
    res.status(400).json({ success: false, message: 'Template appears incomplete. Please use the exported template file.' });
    return;
  }

  const expectedColumnCount = 3 + context.subjects.length * 8;
  const actualColumnCount = Math.max(...rows.map((row) => (Array.isArray(row) ? row.length : 0)), 0);
  if (actualColumnCount < expectedColumnCount) {
    res.status(400).json({
      success: false,
      message: `Invalid template columns. Expected at least ${expectedColumnCount} columns for selected class subjects.`,
    });
    return;
  }

  const studentsByRegNo = new Map(context.students.map((s) => [s.regNo, s]));
  const marksByStudentAndSubject = new Map<string, any>();
  for (const item of context.marksDocs) {
    marksByStudentAndSubject.set(`${item.studentId.toString()}::${item.subjectId.toString()}`, item);
  }

  const normalizedSubjects = context.subjects.map((s) => ({
    _id: s._id,
    name: s.name,
    maxMarks: {
      term1: {
        periodicTest: Number(s.maxMarks?.term1?.periodicTest ?? 10),
        notebook: Number(s.maxMarks?.term1?.notebook ?? 5),
        subEnrichment: Number(s.maxMarks?.term1?.subEnrichment ?? 5),
        halfYearlyExam: Number(s.maxMarks?.term1?.halfYearlyExam ?? 30),
      },
      term2: {
        periodicTest: Number(s.maxMarks?.term2?.periodicTest ?? 10),
        notebook: Number(s.maxMarks?.term2?.notebook ?? 5),
        subEnrichment: Number(s.maxMarks?.term2?.subEnrichment ?? 5),
        yearlyExam: Number(s.maxMarks?.term2?.yearlyExam ?? 30),
      },
    },
  }));

  const parsedResult = parseTemplateRows({
    rows,
    className: context.classDoc.name,
    studentsByRegNo,
    marksByStudentAndSubject,
    subjects: normalizedSubjects,
  });

  res.json({
    success: true,
    data: {
      totalRows: parsedResult.parsed.length + parsedResult.errors.length,
      parsed: parsedResult.parsed,
      errors: parsedResult.errors,
      metadata: {
        classId,
        className: context.classDoc.name,
        subjects: context.subjects.map((s) => ({ _id: s._id.toString(), name: s.name })),
      },
    },
  });
}

export async function importMarksExcel(req: Request, res: Response): Promise<void> {
  const parsed = ImportBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? 'Invalid request body' });
    return;
  }

  const { classId, teacherName, rows } = parsed.data;

  if (rows.length === 0) {
    res.status(400).json({ success: false, message: 'No rows selected for import' });
    return;
  }

  const teacher = await Teacher.findOne({ name: teacherName }).lean();
  if (!teacher) {
    res.status(400).json({ success: false, message: 'Teacher not found' });
    return;
  }

  const context = await getClassContext(classId);
  if (!context) {
    res.status(404).json({ success: false, message: 'Class not found' });
    return;
  }

  const studentsByRegNo = new Map(context.students.map((s) => [s.regNo, s]));
  const subjectsById = new Map(
    context.subjects.map((s) => [
      s._id.toString(),
      {
        _id: s._id.toString(),
        name: s.name,
        maxMarks: {
          term1: {
            periodicTest: Number(s.maxMarks?.term1?.periodicTest ?? 10),
            notebook: Number(s.maxMarks?.term1?.notebook ?? 5),
            subEnrichment: Number(s.maxMarks?.term1?.subEnrichment ?? 5),
            halfYearlyExam: Number(s.maxMarks?.term1?.halfYearlyExam ?? 30),
          },
          term2: {
            periodicTest: Number(s.maxMarks?.term2?.periodicTest ?? 10),
            notebook: Number(s.maxMarks?.term2?.notebook ?? 5),
            subEnrichment: Number(s.maxMarks?.term2?.subEnrichment ?? 5),
            yearlyExam: Number(s.maxMarks?.term2?.yearlyExam ?? 30),
          },
        },
      },
    ])
  );

  const existingMarksMap = new Map<string, any>();
  for (const doc of context.marksDocs) {
    existingMarksMap.set(`${doc.studentId.toString()}::${doc.subjectId.toString()}`, doc);
  }

  const failures: Array<{ row: number; regNo: string; reason: string }> = [];
  let succeeded = 0;

  for (const row of rows as ParsedImportRow[]) {
    const regNo = normalizeText(row.regNo);
    const student = studentsByRegNo.get(regNo);

    if (!student) {
      failures.push({ row: row.rowNumber, regNo, reason: 'Reg. No not found in selected class' });
      continue;
    }

    if (normalizeComparable(row.name) !== normalizeComparable(student.name)) {
      failures.push({ row: row.rowNumber, regNo, reason: `Name mismatch. Expected "${student.name}"` });
      continue;
    }

    if (normalizeComparable(row.className) !== normalizeComparable(context.classDoc.name)) {
      failures.push({ row: row.rowNumber, regNo, reason: `Class mismatch. Expected "${context.classDoc.name}"` });
      continue;
    }

    if (row.studentId !== student._id.toString()) {
      failures.push({ row: row.rowNumber, regNo, reason: 'Student identity mismatch' });
      continue;
    }

    const lock = await checkLocks({
      studentId: student._id.toString(),
      classId,
      teacherReference: teacherName,
    });
    if (lock.locked) {
      failures.push({ row: row.rowNumber, regNo, reason: lock.reason ?? 'Marks are locked' });
      continue;
    }

    let rowHadWrite = false;
    let rowFailed = false;

    for (const [subjectId, incoming] of Object.entries(row.marksBySubject ?? {})) {
      if (!incoming || !hasAnyMarksInput(incoming)) continue;

      const subject = subjectsById.get(subjectId);
      if (!subject) {
        rowFailed = true;
        failures.push({ row: row.rowNumber, regNo, reason: `Subject not found for ID ${subjectId}` });
        break;
      }

      const maxError = assertWithinMax({ term1: incoming.term1, term2: incoming.term2, maxMarks: subject.maxMarks });
      if (maxError) {
        rowFailed = true;
        failures.push({ row: row.rowNumber, regNo, reason: `${subject.name}: ${maxError}` });
        break;
      }

      const existing = existingMarksMap.get(`${student._id.toString()}::${subjectId}`);
      const mergedTerm1: PartialTerm1 = {
        ...(existing?.term1 ?? {}),
        ...(incoming.term1 ?? {}),
      };
      const mergedTerm2: PartialTerm2 = {
        ...(existing?.term2 ?? {}),
        ...(incoming.term2 ?? {}),
      };

      await Marks.findOneAndUpdate(
        { studentId: student._id, subjectId },
        { $set: { teacherName, term1: mergedTerm1, term2: mergedTerm2 } },
        { upsert: true, new: true, runValidators: true }
      );

      rowHadWrite = true;
    }

    if (!rowFailed && rowHadWrite) {
      succeeded += 1;
      await Log.create({
        teacherName,
        action: 'marks_bulk_imported',
        studentId: student._id,
      });
    } else if (!rowFailed && !rowHadWrite) {
      failures.push({ row: row.rowNumber, regNo, reason: 'No marks cells provided in selected row' });
    }
  }

  res.json({
    success: true,
    data: {
      total: rows.length,
      succeeded,
      failed: failures.length,
    },
    errors: failures,
  });
}
