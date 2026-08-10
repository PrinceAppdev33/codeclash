import { Server, Socket } from 'socket.io';
import { prisma } from '../config/db.js';
import { Redis } from 'ioredis';
import { Server as HttpServer } from 'http';
import { socketAuthenticate } from './authenticate.js';
import { createAdapter } from '@socket.io/redis-adapter';
import { MatchmakingService } from '../services/matchmaking.service.js';

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

        socket.on('join_match', async (matchId: string) => {
            const match = await prisma.match.findUnique({
                where: {
                    id: matchId
                }
            });
            if(!match || (match.player1Id !== userId && match.player2Id !== userId)) {
                socket.emit('match:error', { message: 'Not authorized for this match' });
                return;
            }

            socket.join(`match-${matchId}`);
            console.log(`User ${userId} joined match room: match-${matchId}`);
        });

        socket.on('leave_match', (matchId: string) => {
            socket.leave(`match-${matchId}`);
            console.log(`User ${userId} left match room: match-${matchId}`);
        });
        socket.on('disconnect', async (reason) => {
            console.log(`Socket disconnected: ${socket.id}, Reason: ${reason}`);
            await MatchmakingService.removeFromQueueBySocketId(socket.id);
        });

        socket.on('queue:join', async () => {
            try {
                const userId = socket.data.userId;
                const user = await prisma.user.findUnique({ where: { id: userId } });
                if (!user) {
                    console.error(`User not found for ID: ${userId}`);
                    return;
                }

                await MatchmakingService.addToQueue(user.id, socket.id, user.elo);

                const result = await MatchmakingService.findMatchForPlayer(user.id, user.elo, socket.id, 100);
                
                if(result) {
                    const { match, player1SocketId, player2SocketId } = result;

                    io?.sockets.sockets.get(player1SocketId)?.join(`match-${match.id}`);
                    io?.sockets.sockets.get(player2SocketId)?.join(`match-${match.id}`);

                    io?.to(`match-${match.id}`).emit('match:found', match);
                } else {
                    socket.emit('queue:joined');
                }
            } catch (error) {
                console.error('Error handling queue:join event:', error);
                socket.emit('queue:error', { message: 'Failed to join queue' });
            }
        });

        socket.on('queue:leave', async () => {
            try {
                const userId = socket.data.userId;
                await MatchmakingService.removeFromQueueByUserId(userId);
                socket.emit('queue:left');

            } catch (error) {
                console.error('Error handling queue:leave event:', error);
                socket.emit('queue:error', { message: 'Failed to leave queue' });
            }
        })
        
    });
    return io;
}

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};
