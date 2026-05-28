import { Router } from 'express';
import { login, googleLogin, logout } from '../controllers/auth.controller';
import { strictLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', strictLimiter, login);
router.post('/google', strictLimiter, googleLogin);
router.post('/logout', logout);

export default router;
