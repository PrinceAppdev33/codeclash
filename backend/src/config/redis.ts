import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});