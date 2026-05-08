import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getStudentReport, bulkStudentReport, bulkStudentReportPdf } from '../controllers/report.controller';

const router = Router();

// Teacher portal flow: single-student report generation is intentionally unauthenticated
router.get('/student/:studentId', getStudentReport);

// Bulk ZIP download: POST /reports/bulk  { studentIds: string[] }
router.post('/bulk', authenticate, bulkStudentReport);

// Bulk combined PDF download: POST /reports/bulk-pdf  { studentIds: string[] }
router.post('/bulk-pdf', authenticate, bulkStudentReportPdf);

export default router;
