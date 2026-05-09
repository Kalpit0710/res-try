import { Router } from 'express';
import { getMarks, createMarks, updateMarks, batchSaveMarks } from '../controllers/marks.controller';

const router = Router();

// Teacher flow is intentionally unauthenticated per PRD
router.get('/', getMarks);
router.post('/', createMarks);
router.put('/batch', batchSaveMarks);
router.put('/:id', updateMarks);

export default router;
