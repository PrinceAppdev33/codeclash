import { submitCode, runPublicTestCases } from '../controllers/submission.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';
import { Router } from 'express';

const router = Router();

router.post('/submit', AuthMiddleware, submitCode);
router.post('/run', AuthMiddleware, runPublicTestCases);

export default router;