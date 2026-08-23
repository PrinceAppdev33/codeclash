import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing in your .env file!");
}

const pool = new Pool({ 
  connectionString,
  ssl: {
    rejectUnauthorized: false 
  },
  keepAlive: true,                    
  keepAliveInitialDelayMillis: 10000, 
  connectionTimeoutMillis: 15000,     
  max: 10,                            
  idleTimeoutMillis: 30000,           
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
