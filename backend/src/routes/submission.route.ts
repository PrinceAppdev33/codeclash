import { submitCode, runPublicTestCases } from '../controllers/submission.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';
import { Router } from 'express';

const router = Router();

router.post('/submitCode', AuthMiddleware, submitCode);
router.post('/runPublicTestCases', AuthMiddleware, runPublicTestCases);

export default router;