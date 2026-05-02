import { Request, Response } from 'express';
import archiver from 'archiver';
import { generateStudentReportPdf } from '../services/report.service';
import { Student } from '../models/Student';

// GET /reports/student/:studentId
export async function getStudentReport(req: Request, res: Response): Promise<void> {
  const pdf = await generateStudentReportPdf(req.params.studentId);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="report-card.pdf"');
  res.send(pdf);
}

// POST /reports/bulk  — body: { studentIds: string[] }
export async function bulkStudentReport(req: Request, res: Response): Promise<void> {
  const { studentIds } = req.body as { studentIds?: string[] };

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    res.status(400).json({ success: false, message: 'studentIds array is required' });
    return;
  }

  if (studentIds.length > 100) {
    res.status(400).json({ success: false, message: 'Maximum 100 students per bulk download' });
    return;
  }

  // Resolve student names for filenames
  const students = await Student.find({ _id: { $in: studentIds } }).select('name regNo').lean();
  const studentMap = new Map(students.map(s => [s._id.toString(), s]));

  // Generate all PDFs in parallel
  const results = await Promise.allSettled(
    studentIds.map(async (id) => {
      const pdf = await generateStudentReportPdf(id);
      const student = studentMap.get(id);
      const safeName = (student?.name ?? id).replace(/[^a-z0-9_\-\s]/gi, '_').trim();
      const filename = `${safeName}_${student?.regNo ?? id}.pdf`;
      return { pdf, filename };
    })
  );

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="report-cards.zip"');

  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.pipe(res);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      archive.append(result.value.pdf, { name: result.value.filename });
    }
  }

  await archive.finalize();
}
