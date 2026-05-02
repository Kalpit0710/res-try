import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getClasses, getClassById, createClass, updateClass, deleteClass, addSubjectToClass, removeSubjectFromClass } from '../controllers/class.controller';

const router = Router();

router.get('/', authenticate, getClasses);
router.get('/:id', authenticate, getClassById);
router.post('/', authenticate, createClass);
router.put('/:id', authenticate, updateClass);
router.delete('/:id', authenticate, deleteClass);
router.post('/:id/subjects', authenticate, addSubjectToClass);
router.delete('/:id/subjects/:subjectId', authenticate, removeSubjectFromClass);

export default router;
