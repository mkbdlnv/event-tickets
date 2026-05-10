import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });

redis.on('error', (error) => {
  console.error('Redis error:', error.message);
});

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

export async function getJson(key) {
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
}

export async function setJson(key, value, ttlSeconds) {
  await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
}

export async function deleteByPattern(pattern) {
  const keys = [];
  for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    keys.push(key);
  }
  if (keys.length) {
    await redis.del(keys);
  }
}

export default redis;
