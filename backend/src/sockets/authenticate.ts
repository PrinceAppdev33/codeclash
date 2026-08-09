import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';


export const socketAuthenticate = (socket: Socket, next: (err?: Error) => void) => {
    try {
        const userId = socket.handshake.auth.userId;
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
