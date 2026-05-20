import { Router } from 'express';
import {
  getLowerClassSubjects,
  getLowerClassSubjectById,
  createLowerClassSubject,
  updateLowerClassSubject,
  deleteLowerClassSubject,
  bulkCreateLowerClassSubjects,
} from '../controllers/lowerClassSubject.controller';

const router = Router();

router.route('/')
  .get(getLowerClassSubjects)
  .post(createLowerClassSubject);

router.route('/bulk')
  .post(bulkCreateLowerClassSubjects);

router.route('/:id')
  .get(getLowerClassSubjectById)
  .put(updateLowerClassSubject)
  .delete(deleteLowerClassSubject);

export default router;
