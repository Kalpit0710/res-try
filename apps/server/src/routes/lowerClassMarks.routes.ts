import { Router } from 'express';
import {
  getLowerClassMarks,
  getLowerClassMarksByStudent,
  upsertLowerClassMarks,
  bulkUpsertLowerClassMarks,
  deleteLowerClassMarks,
  getClassMarksSummary,
} from '../controllers/lowerClassMarks.controller';

const router = Router();

router.route('/')
  .get(getLowerClassMarks)
  .post(upsertLowerClassMarks);

router.route('/bulk')
  .post(bulkUpsertLowerClassMarks);

router.route('/student/:studentId')
  .get(getLowerClassMarksByStudent);

router.route('/class/:classId/summary')
  .get(getClassMarksSummary);

router.route('/:id')
  .delete(deleteLowerClassMarks);

export default router;
