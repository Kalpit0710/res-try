import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getStudentReport, bulkStudentReport } from '../controllers/report.controller';

const router = Router();

// Admin use-case (teacher flow can be added later if needed)
router.get('/student/:studentId', authenticate, getStudentReport);

// Bulk ZIP download: POST /reports/bulk  { studentIds: string[] }
router.post('/bulk', authenticate, bulkStudentReport);

export default router;
