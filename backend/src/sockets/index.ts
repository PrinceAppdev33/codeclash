import { Server, Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { Server as HttpServer } from 'http';
import { socketAuthenticate } from './authenticate.js';
import { createAdapter } from '@socket.io/redis-adapter';

let io: Server | null = null;

export const initSocketServer = (httpServer: HttpServer): Server => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    const pubClient = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
    });

    pubClient.on('error', (err) => {
        console.error('Redis Pub Client Error:', err.message);
    });

    const subClient = pubClient.duplicate();
    subClient.on('error', (err) => {
        console.error('Redis Sub Client Error:', err.message);
    });   
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
        adapter: createAdapter(pubClient, subClient),
    });

    io.use(socketAuthenticate);

    io.on('connection', (socket: Socket) => {
        console.log(`Socket connected: ${socket.id}, User ID: ${socket.data.userId}`);
        const userId = socket.data.userId;

        socket.on('join_match', (matchId: string) => {
            socket.join(`match-${matchId}`);
            console.log(`User ${userId} joined match room: match-${matchId}`);
        });

        socket.on('leave_match', (matchId: string) => {
            socket.leave(`match:${matchId}`);
            console.log(`User ${userId} left match room: match-${matchId}`);
        });
        socket.on('disconnect', (reason) => {
            console.log(`Socket disconnected: ${socket.id}, Reason: ${reason}`);
        });

        
    });
    return io;
}

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};
