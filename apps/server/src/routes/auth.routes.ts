import { Router } from 'express';
import { login, logout, updateAdminCredentials, teacherLogin, resetTeacherPin } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { strictLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', strictLimiter, login);
router.post('/logout', logout);
router.put('/admin/credentials', authenticate, updateAdminCredentials);

router.post('/teacher/login', strictLimiter, teacherLogin);
router.post('/teacher/reset-pin', resetTeacherPin);

export default router;
