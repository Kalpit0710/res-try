import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getLogs } from '../controllers/log.controller';

const router = Router();

router.get('/', authenticate, getLogs);

export default router;
