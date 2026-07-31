import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';


export function AuthMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if(!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'Aryan@123';
    try {
        const token = authHeader.split(' ')[1];
        if(!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const payload = jwt.verify(token, JWT_SECRET);
        (req as any).userId = (payload as any).userId;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}   