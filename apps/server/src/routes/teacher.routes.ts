import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from '../controllers/teacher.controller';

const router = Router();

router.get('/', authenticate, getTeachers);
router.get('/:id', authenticate, getTeacherById);
router.post('/', authenticate, createTeacher);
router.put('/:id', authenticate, updateTeacher);
router.delete('/:id', authenticate, deleteTeacher);

export default router;
