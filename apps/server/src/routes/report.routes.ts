import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getStudentReport } from '../controllers/report.controller';

const router = Router();

// Admin use-case (teacher flow can be added later if needed)
router.get('/student/:studentId', authenticate, getStudentReport);

export default router;
