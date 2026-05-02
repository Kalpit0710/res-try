import { Router } from 'express';
import { getRemarkByStudent, createOrUpdateRemark } from '../controllers/remarks.controller';

const router = Router();

// Teacher flow is intentionally unauthenticated like marks
router.get('/student/:studentId', getRemarkByStudent);
router.post('/', createOrUpdateRemark);

export default router;
