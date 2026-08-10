import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';


export const socketAuthenticate = (socket: Socket, next: (err?: Error) => void) => {
    try {
        const token = socket.handshake.auth.token;
        if(!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET || 'Aryan@123');
        const userId = (payload as any).userId;
        if(!userId) {
            return next(new Error('Authentication error: No userId provided'));
        }
        socket.data.userId = userId;
        next();
    } catch (error) {
        console.error('Socket authentication error:', error);
        return next(new Error('Authentication error: Invalid or expired token'));
    }
}
