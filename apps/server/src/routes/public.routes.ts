import { Router } from 'express';
import { getPublicClasses, getPublicStudents, getPublicSubjects, getPublicTeachers } from '../controllers/public.controller';

const router = Router();

router.get('/classes', getPublicClasses);
router.get('/students', getPublicStudents);
router.get('/subjects', getPublicSubjects);
router.get('/teachers', getPublicTeachers);

export default router;
