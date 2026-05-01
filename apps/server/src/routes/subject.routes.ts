import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getSubjects, getSubjectById, createSubject, updateSubject, deleteSubject } from '../controllers/subject.controller';

const router = Router();

router.get('/', authenticate, getSubjects);
router.get('/:id', authenticate, getSubjectById);
router.post('/', authenticate, createSubject);
router.put('/:id', authenticate, updateSubject);
router.delete('/:id', authenticate, deleteSubject);

export default router;
