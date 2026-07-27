import {Router} from 'express';
import type {Request, Response} from  'express';
import passport from '../config/passport.js';
import { registerWithEmail, loginWithEmail } from '../controllers/user.controller.js';
import type {AuthResponse} from '../services/user.service.js';

const router = Router();

router.post('/signup', registerWithEmail);
router.post('/register', registerWithEmail);
router.post('/login', loginWithEmail);

router.get('/github',
  passport.authenticate('github', { session: false, scope: ['user:email'] })
);
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=github_auth_failed` }),
  (req: Request, res: Response) => {
    const { token } = req.user as AuthResponse;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }
);

export default router;