import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkUploadStudents,
  parseBulkStudents,
  commitBulkStudents,
} from '../controllers/student.controller';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get('/', authenticate, getStudents);
router.get('/:id', authenticate, getStudentById);
router.post('/', authenticate, createStudent);
router.put('/:id', authenticate, updateStudent);
router.delete('/:id', authenticate, deleteStudent);
router.post('/bulk-upload', authenticate, upload.single('file'), bulkUploadStudents);
router.post('/bulk-parse', authenticate, upload.single('file'), parseBulkStudents);
router.post('/bulk-commit', authenticate, commitBulkStudents);

export default router;
