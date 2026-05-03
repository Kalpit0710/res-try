import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getStudentReport, bulkStudentReport } from '../controllers/report.controller';

const router = Router();

// Teacher portal flow: single-student report generation is intentionally unauthenticated
router.get('/student/:studentId', getStudentReport);

// Bulk ZIP download: POST /reports/bulk  { studentIds: string[] }
router.post('/bulk', authenticate, bulkStudentReport);

export default router;
