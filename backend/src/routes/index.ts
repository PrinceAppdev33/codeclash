import { Router } from 'express';
import authRoutes from './auth.route.js';
import matchRoutes from './match.route.js';
import submissionRoutes from './submission.route.js';


const router = Router();
router.use('/auth', authRoutes);
router.use('/match', matchRoutes);
router.use('/submission', submissionRoutes);

export default router;