import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import bookingRoutes from './routes/bookings.js';
import userRoutes from './routes/users.js';
import healthRoutes from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { connectRedis } from './services/cacheService.js';

dotenv.config();

await connectRedis();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use(errorHandler);

export default app;
