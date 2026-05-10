import express from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { revokeRefreshToken, refreshCookieOptions } from '../services/tokenService.js';

const router = express.Router();

router.delete('/me', requireAuth, async (req, res, next) => {
  try {
    await revokeRefreshToken(req.cookies.refreshToken);
    await db('users').where({ id: req.user.id }).del();
    res.clearCookie('refreshToken', refreshCookieOptions);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
