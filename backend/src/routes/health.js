import express from 'express';
import db from '../db/index.js';
import redis from '../services/cacheService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const services = { postgres: 'ok', redis: 'ok' };

  try {
    await db.raw('SELECT 1');
  } catch {
    services.postgres = 'error';
  }

  try {
    await redis.ping();
  } catch {
    services.redis = 'error';
  }

  const ok = services.postgres === 'ok' && services.redis === 'ok';
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services,
    uptime_seconds: Math.floor(process.uptime())
  });
});

export default router;
