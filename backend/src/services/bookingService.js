import db from '../db/index.js';
import { deleteByPattern } from './cacheService.js';

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function conflict(message) {
  const error = new Error(message);
  error.status = 409;
  return error;
}

function validateSeatRequest(eventId, seatIds) {
  if (!eventId || !Array.isArray(seatIds) || seatIds.length === 0) {
    throw badRequest('Выберите хотя бы одно место.');
  }
  if (seatIds.length > 6) {
    throw badRequest('Можно выбрать не больше 6 мест за один заказ.');
  }
}

export async function lockSeats(userId, eventId, seatIds) {
  validateSeatRequest(eventId, seatIds);

  return db.transaction(async (trx) => {
    const seats = await trx('seats')
      .whereIn('id', seatIds)
      .andWhere('event_id', eventId)
      .forUpdate()
      .select();

    const now = new Date();
    const available = seats.filter(
      (seat) =>
        seat.status === 'available' ||
        (seat.status === 'locked' && seat.locked_until && new Date(seat.locked_until) < now)
    );

    if (seats.length !== seatIds.length || available.length !== seatIds.length) {
      throw conflict('Одно или несколько мест недоступны. Выберите другие места.');
    }

    const lockedUntil = new Date(now.getTime() + 5 * 60 * 1000);
    await trx('seats').whereIn('id', seatIds).update({
      status: 'locked',
      locked_until: lockedUntil,
      locked_by: userId
    });

    await deleteByPattern(`event:${eventId}:seats*`);
    return { lockedSeats: seatIds, expiresAt: lockedUntil };
  });
}

export async function confirmBooking(userId, eventId, seatIds) {
  validateSeatRequest(eventId, seatIds);

  return db.transaction(async (trx) => {
    const seats = await trx('seats')
      .whereIn('id', seatIds)
      .andWhere('event_id', eventId)
      .forUpdate()
      .orderBy(['row_label', 'seat_number'])
      .select();

    const now = new Date();
    const allHeldByUser =
      seats.length === seatIds.length &&
      seats.every(
        (seat) =>
          seat.status === 'locked' &&
          Number(seat.locked_by) === Number(userId) &&
          seat.locked_until &&
          new Date(seat.locked_until) > now
      );

    if (!allHeldByUser) {
      throw conflict('Время бронирования истекло или места уже недоступны.');
    }

    const event = await trx('events').where({ id: eventId }).first();
    if (!event) throw badRequest('Событие не найдено.');

    const price = Number(event.price);
    const totalPrice = price * seats.length;
    const [booking] = await trx('bookings')
      .insert({
        user_id: userId,
        event_id: eventId,
        total_price: totalPrice,
        status: 'confirmed'
      })
      .returning('*');

    await trx('booking_items').insert(
      seats.map((seat) => ({
        booking_id: booking.id,
        seat_id: seat.id,
        price
      }))
    );

    await trx('seats').whereIn('id', seatIds).update({
      status: 'sold',
      locked_until: null,
      locked_by: null
    });

    await deleteByPattern('events:*');
    await deleteByPattern(`event:${eventId}:seats*`);

    return {
      booking_id: booking.id,
      seats,
      total_price: totalPrice
    };
  });
}

export async function releaseLocks(userId, seatIds) {
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    throw badRequest('Выберите места для снятия резерва.');
  }

  const seats = await db('seats').whereIn('id', seatIds).andWhere('locked_by', userId).select('event_id');
  await db('seats').whereIn('id', seatIds).andWhere('locked_by', userId).update({
    status: 'available',
    locked_until: null,
    locked_by: null
  });

  await Promise.all([...new Set(seats.map((seat) => seat.event_id))].map((id) => deleteByPattern(`event:${id}:seats*`)));
  return { released: seatIds };
}
