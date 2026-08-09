import express from 'express';
import cors  from 'cors';
import dotenv from 'dotenv';
import { prisma } from './config/db.js';
import passport from './config/passport.js';
import routes from './routes/index.js';
import { initSocketServer } from './sockets/index.js';
import { createServer } from 'http';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use('/api', routes);
app.use(express.urlencoded({ extended: true}));

const httpServer = createServer(app);

initSocketServer(httpServer);


app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});