import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCoScholasticMarks,
  getCoScholasticMarksByStudent,
  createOrUpdateCoScholasticMarks,
  deleteCoScholasticMarks,
} from '../controllers/coScholasticMarks.controller';

const router = Router();

// Teacher flow is intentionally unauthenticated like marks/remarks
router.get('/', getCoScholasticMarks);
router.get('/student/:studentId', getCoScholasticMarksByStudent);
router.post('/', createOrUpdateCoScholasticMarks);
router.delete('/:id', authenticate, deleteCoScholasticMarks);

export default router;
