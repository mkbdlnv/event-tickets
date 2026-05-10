import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import redis from './cacheService.js';

const accessTtl = '15m';
const refreshTtlSeconds = 7 * 24 * 60 * 60;

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    role: user.role
  };
}

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: accessTtl }
  );
}

export async function createRefreshToken(user) {
  const tokenId = uuidv4();
  const token = jwt.sign({ sub: user.id, jti: tokenId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: refreshTtlSeconds
  });
  await redis.set(`refresh:${tokenId}`, String(user.id), { EX: refreshTtlSeconds });
  return token;
}

export async function verifyRefreshToken(token) {
  const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const storedUserId = await redis.get(`refresh:${payload.jti}`);
  if (!storedUserId || Number(storedUserId) !== Number(payload.sub)) {
    const error = new Error('Сессия истекла. Войдите снова.');
    error.status = 401;
    throw error;
  }
  return payload;
}

export async function revokeRefreshToken(token) {
  if (!token) return;
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    await redis.del(`refresh:${payload.jti}`);
  } catch {
    // Invalid or expired token is already unusable.
  }
}

export const refreshCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: refreshTtlSeconds * 1000
};
