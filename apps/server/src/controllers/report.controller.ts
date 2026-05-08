import { Request, Response } from 'express';
import PDFMerger from 'pdf-merger-js';
import archiver from 'archiver';
import { generateStudentReportPdf, getReportBrowser } from '../services/report.service';
import { Student } from '../models/Student';

const BULK_BATCH_SIZE = 4;

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

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="report-cards.zip"');

  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.pipe(res);

  const failures: Array<{ studentId: string; message: string }> = [];
  let successCount = 0;
  const browser = await getReportBrowser();

  try {
    for (let i = 0; i < studentIds.length; i += BULK_BATCH_SIZE) {
      const batch = studentIds.slice(i, i + BULK_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (id) => {
          const pdf = await generateStudentReportPdf(id, browser);
          const student = studentMap.get(id);
          const safeName = (student?.name ?? id).replace(/[^a-z0-9_\-\s]/gi, '_').trim();
          const filename = `${safeName}_${student?.regNo ?? id}.pdf`;
          return { pdf, filename };
        })
      );

      for (let index = 0; index < results.length; index += 1) {
        const result = results[index];
        const studentId = batch[index];

        if (result.status === 'fulfilled') {
          archive.append(result.value.pdf, { name: result.value.filename });
          successCount += 1;
        } else {
          failures.push({ studentId, message: result.reason instanceof Error ? result.reason.message : String(result.reason) });
        }
      }
    }

    if (successCount === 0) {
      archive.append(
        Buffer.from(
          `No report PDFs could be generated.\n\nPossible reasons:\n- Chromium executable path is missing or invalid\n- MongoDB data is incomplete for the selected students\n- A report template/runtime error occurred\n\nFailures:\n${failures.map((failure) => `- ${failure.studentId}: ${failure.message}`).join('\n') || '- No detailed errors captured'}\n`
        ),
        { name: 'generation-errors.txt' }
      );
    } else if (failures.length > 0) {
      archive.append(
        Buffer.from(
          `Some reports failed to generate. Successful PDFs were included in this archive.\n\nFailures:\n${failures.map((failure) => `- ${failure.studentId}: ${failure.message}`).join('\n')}\n`
        ),
        { name: 'generation-errors.txt' }
      );
    }

    await archive.finalize();
  } finally {
    void browser;
  }
}

// POST /reports/bulk-pdf  — body: { studentIds: string[] } - Single combined PDF
export async function bulkStudentReportPdf(req: Request, res: Response): Promise<void> {
  const { studentIds } = req.body as { studentIds?: string[] };

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    res.status(400).json({ success: false, message: 'studentIds array is required' });
    return;
  }

  if (studentIds.length > 100) {
    res.status(400).json({ success: false, message: 'Maximum 100 students per bulk download' });
    return;
  }

  const merger = new PDFMerger();
  const failures: Array<{ studentId: string; message: string }> = [];
  let successCount = 0;
  const browser = await getReportBrowser();

  try {
    for (let i = 0; i < studentIds.length; i += BULK_BATCH_SIZE) {
      const batch = studentIds.slice(i, i + BULK_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (id) => {
          const pdf = await generateStudentReportPdf(id, browser);
          return { pdf, studentId: id };
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          await merger.add(result.value.pdf);
          successCount += 1;
        } else {
          const studentId = result.reason?.studentId || 'unknown';
          failures.push({ studentId, message: result.reason instanceof Error ? result.reason.message : String(result.reason) });
        }
      }
    }

    if (successCount === 0) {
      res.status(500).json({
        success: false,
        message: 'No report PDFs could be generated',
        failures
      });
      return;
    }

    const mergedPdf = await merger.saveAsBuffer();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="combined-report-cards-${new Date().toISOString().slice(0, 10)}.pdf"`);
    res.send(mergedPdf);

  } finally {
    void browser;
  }
}
