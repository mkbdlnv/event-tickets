import db from '../db/index.js';
import { deleteByPattern } from '../services/cacheService.js';

export async function releaseExpiredLocks() {
  const expired = await db('seats')
    .where('status', 'locked')
    .andWhere('locked_until', '<', new Date())
    .select('event_id');

  if (!expired.length) return 0;

  const result = await db('seats')
    .where('status', 'locked')
    .andWhere('locked_until', '<', new Date())
    .update({
      status: 'available',
      locked_until: null,
      locked_by: null
    });

  await Promise.all([...new Set(expired.map((seat) => seat.event_id))].map((id) => deleteByPattern(`event:${id}:seats*`)));
  if (result > 0) {
    console.log(`[lockExpiry] Released ${result} expired seat locks`);
  }
  return result;
}

export function startLockExpiryJob() {
  releaseExpiredLocks().catch((error) => console.error('[lockExpiry]', error.message));
  return setInterval(() => {
    releaseExpiredLocks().catch((error) => console.error('[lockExpiry]', error.message));
  }, 60 * 1000);
}
