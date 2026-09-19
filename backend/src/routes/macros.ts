import { Router } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// All routes implemented in Phase 4

export default router;
