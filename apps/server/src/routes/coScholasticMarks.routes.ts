import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCoScholasticMarks,
  getCoScholasticMarksByStudent,
  createOrUpdateCoScholasticMarks,
  deleteCoScholasticMarks,
} from '../controllers/coScholasticMarks.controller';

const router = Router();

router.get('/', authenticate, getCoScholasticMarks);
router.get('/student/:studentId', authenticate, getCoScholasticMarksByStudent);
router.post('/', authenticate, createOrUpdateCoScholasticMarks);
router.delete('/:id', authenticate, deleteCoScholasticMarks);

export default router;
