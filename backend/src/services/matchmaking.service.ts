import { redis } from "../config/redis.js";
import  { MatchService } from "./match.service.js"
import type { MatchDetails } from "./match.service.js";


export interface QueuePlayerPayload {
    userId: string,
    elo: number,
    socketId: string,
    joinedAt: number,
}


export interface MatchFoundResult {
    player1SocketId: string,
    player2SocketId: string,
    match: MatchDetails,
}



export class MatchmakingService {
    private static QUEUE_KEY = 'matchmaking:queue';


    static async addToQueue(userId: string, socketId: string, elo: number): Promise<void> {
        await this.removeFromQueueByUserId(userId);

        const payload: QueuePlayerPayload = {
            userId,
            elo,
            socketId,
            joinedAt: Date.now(),
        }
        await redis.zadd(this.QUEUE_KEY, payload.elo, JSON.stringify(payload));
    }


    static async removeFromQueueBySocketId(socketId: string): Promise<boolean> {
        const members = await redis.zrange(this.QUEUE_KEY, "0", "-1");

        for (const member of members) {
        const parsed: QueuePlayerPayload = JSON.parse(member);
        if (parsed.socketId === socketId) {
            await redis.zrem(this.QUEUE_KEY, member);
            return true;
        }
        }

        return false;
    }

    static async removeFromQueueByUserId(userId: string): Promise<boolean> {
        const members = await redis.zrange(this.QUEUE_KEY, '0', '-1');

        for(const member of members) {
            const payload: QueuePlayerPayload = JSON.parse(member);
            if(payload.userId === userId) {
                await redis.zrem(this.QUEUE_KEY, member);
                return true;
            }
        }
        return false;
    }

    static async findMatchForPlayer(userId: string, elo: number, socketId: string, range: 100): Promise<MatchFoundResult | null> {
        const minElo = Math.max(0, elo - range);
        const maxElo = elo + range;

        const candidates = await redis.zrangebyscore(this.QUEUE_KEY, minElo, maxElo);

        for (const candidate of candidates) {
            const parsed: QueuePlayerPayload = JSON.parse(candidate);

            if(parsed.userId !== userId) {
                await redis.zrem(this.QUEUE_KEY, candidate);
                await this.removeFromQueueByUserId(userId);
                
                const match = await MatchService.createMatch({player1Id: userId, player2Id: parsed.userId});

                return {
                    match,
                    player1SocketId: socketId,
                    player2SocketId: parsed.socketId,
                }   
            }
        }
        return null;
    }

    static async getQueueCount(): Promise<number> {
        return await redis.zcard(this.QUEUE_KEY);
    }
}