import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getLocks, createLock, updateLock, deleteLock } from '../controllers/lock.controller';

const router = Router();

router.get('/', authenticate, getLocks);
router.post('/', authenticate, createLock);
router.put('/:id', authenticate, updateLock);
router.delete('/:id', authenticate, deleteLock);

export default router;
