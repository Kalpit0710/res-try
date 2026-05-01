import { Request, Response } from 'express';
import { generateStudentReportPdf } from '../services/report.service';

// GET /reports/student/:studentId
export async function getStudentReport(req: Request, res: Response): Promise<void> {
  const pdf = await generateStudentReportPdf(req.params.studentId);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="report-card.pdf"');
  res.send(pdf);
}
