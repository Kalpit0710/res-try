import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { getMarks, createMarks, updateMarks } from '../controllers/marks.controller';
import { downloadMarksExcelTemplate, parseMarksExcel, importMarksExcel } from '../controllers/marksExcel.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Admin-only Excel round-trip flow
router.get('/admin/excel-template', authenticate, downloadMarksExcelTemplate);
router.post('/admin/excel-parse', authenticate, upload.single('file'), parseMarksExcel);
router.post('/admin/excel-import', authenticate, importMarksExcel);

// Teacher flow is intentionally unauthenticated per PRD
router.get('/', getMarks);
router.post('/', createMarks);
router.put('/:id', updateMarks);

export default router;
