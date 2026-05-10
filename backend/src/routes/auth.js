import express from 'express';
import bcrypt from 'bcrypt';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import {
  createRefreshToken,
  publicUser,
  refreshCookieOptions,
  revokeRefreshToken,
  signAccessToken,
  verifyRefreshToken
} from '../services/tokenService.js';

const router = express.Router();

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, refreshCookieOptions);
}

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, display_name: displayName } = req.body;
    if (!email || !password || !displayName) {
      const error = new Error('Заполните имя, email и пароль.');
      error.status = 400;
      throw error;
    }

    const existing = await db('users').where({ email: email.toLowerCase() }).first();
    if (existing) {
      const error = new Error('Пользователь с таким email уже существует.');
      error.status = 409;
      throw error;
    }

    const [user] = await db('users')
      .insert({
        email: email.toLowerCase(),
        password: await bcrypt.hash(password, 12),
        display_name: displayName,
        role: 'customer'
      })
      .returning('*');

    const refreshToken = await createRefreshToken(user);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ user: publicUser(user), accessToken: signAccessToken(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await db('users').where({ email: String(email || '').toLowerCase() }).first();
    const passwordOk = user ? await bcrypt.compare(password || '', user.password) : false;

    if (!user || !passwordOk) {
      const error = new Error('Неверный email или пароль.');
      error.status = 401;
      throw error;
    }

    const refreshToken = await createRefreshToken(user);
    setRefreshCookie(res, refreshToken);
    res.json({ user: publicUser(user), accessToken: signAccessToken(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      const error = new Error('Сессия истекла. Войдите снова.');
      error.status = 401;
      throw error;
    }

    const payload = await verifyRefreshToken(token);
    const user = await db('users').where({ id: payload.sub }).first();
    if (!user) {
      const error = new Error('Пользователь не найден.');
      error.status = 401;
      throw error;
    }

    res.json({ user: publicUser(user), accessToken: signAccessToken(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await revokeRefreshToken(req.cookies.refreshToken);
    res.clearCookie('refreshToken', refreshCookieOptions);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
