import express from 'express';
import db from '../db/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { deleteByPattern, getJson, setJson } from '../services/cacheService.js';

const router = express.Router();
const editableFields = ['title', 'description', 'category', 'venue', 'city', 'starts_at', 'price'];

function normalizeSeat(seat) {
  if (seat.status === 'locked' && seat.locked_until && new Date(seat.locked_until) < new Date()) {
    return { ...seat, status: 'available', locked_until: null, locked_by: null };
  }
  return seat;
}

function applyPublicFilters(query, req) {
  query.whereNull('events.deleted_at');
  if (req.query.category) query.where('events.category', req.query.category);
  if (req.query.city) query.whereILike('events.city', `%${req.query.city}%`);
  if (req.query.search) {
    query.where((builder) => {
      builder.whereILike('events.title', `%${req.query.search}%`).orWhereILike('events.description', `%${req.query.search}%`);
    });
  }
}

function eventPayload(body) {
  return editableFields.reduce((payload, field) => {
    if (body[field] !== undefined) payload[field] = body[field];
    return payload;
  }, {});
}

function validateSeatConfig(seatConfig) {
  const rows = seatConfig?.rows;
  const seatsPerRow = Number(seatConfig?.seats_per_row);
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 10 || !Number.isInteger(seatsPerRow) || seatsPerRow < 1 || seatsPerRow > 20) {
    const error = new Error('Некорректная конфигурация мест.');
    error.status = 400;
    throw error;
  }
  return { rows, seatsPerRow };
}

router.post('/', requireAuth, requireRole('manager', 'admin'), async (req, res, next) => {
  try {
    const payload = eventPayload(req.body);
    const required = ['title', 'category', 'venue', 'city', 'starts_at', 'price'];
    if (required.some((field) => !payload[field])) {
      const error = new Error('Заполните обязательные поля события.');
      error.status = 400;
      throw error;
    }

    const { rows, seatsPerRow } = validateSeatConfig(req.body.seat_config);
    const result = await db.transaction(async (trx) => {
      const [event] = await trx('events')
        .insert({
          ...payload,
          price: Number(payload.price),
          created_by: req.user.id
        })
        .returning('*');

      await trx('seats').insert(
        rows.flatMap((row) =>
          Array.from({ length: seatsPerRow }, (_, index) => ({
            event_id: event.id,
            row_label: String(row),
            seat_number: index + 1,
            status: 'available'
          }))
        )
      );

      return event;
    });

    await deleteByPattern('events:*');
    res.status(201).json({ ...result, price: Number(result.price) });
  } catch (error) {
    next(error);
  }
});

router.get('/mine', requireAuth, requireRole('manager', 'admin'), async (req, res, next) => {
  try {
    const query = db('events')
      .leftJoin('seats', 'events.id', 'seats.event_id')
      .whereNull('events.deleted_at')
      .where('events.created_by', req.user.id)
      .select(
        'events.id',
        'events.title',
        'events.description',
        'events.category',
        'events.venue',
        'events.city',
        'events.starts_at',
        'events.price'
      )
      .count({ total_seats: 'seats.id' })
      .sum({
        available_seats: db.raw(
          "CASE WHEN seats.status = 'available' OR (seats.status = 'locked' AND seats.locked_until < NOW()) THEN 1 ELSE 0 END"
        )
      })
      .groupBy('events.id')
      .orderBy('events.starts_at', 'asc');

    const events = await query;
    res.json(
      events.map((event) => ({
        ...event,
        price: Number(event.price),
        total_seats: Number(event.total_seats),
        available_seats: Number(event.available_seats || 0)
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const cacheKey = `events:${new URLSearchParams(req.query).toString()}`;
    const cached = await getJson(cacheKey);
    if (cached) return res.json(cached);

    const query = db('events')
      .leftJoin('seats', 'events.id', 'seats.event_id')
      .select(
        'events.id',
        'events.title',
        'events.description',
        'events.category',
        'events.venue',
        'events.city',
        'events.starts_at',
        'events.price'
      )
      .count({ total_seats: 'seats.id' })
      .sum({
        available_seats: db.raw(
          "CASE WHEN seats.status = 'available' OR (seats.status = 'locked' AND seats.locked_until < NOW()) THEN 1 ELSE 0 END"
        )
      })
      .groupBy('events.id')
      .orderBy('events.starts_at', 'asc');

    applyPublicFilters(query, req);

    const countQuery = db('events').count({ count: 'id' });
    countQuery.whereNull('deleted_at');
    if (req.query.category) countQuery.where('category', req.query.category);
    if (req.query.city) countQuery.whereILike('city', `%${req.query.city}%`);
    if (req.query.search) {
      countQuery.where((builder) => {
        builder.whereILike('title', `%${req.query.search}%`).orWhereILike('description', `%${req.query.search}%`);
      });
    }

    const [events, [{ count }]] = await Promise.all([
      query.limit(limit).offset((page - 1) * limit),
      countQuery
    ]);

    const payload = {
      data: events.map((event) => ({
        ...event,
        price: Number(event.price),
        total_seats: Number(event.total_seats),
        available_seats: Number(event.available_seats || 0)
      })),
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit)
      }
    };

    await setJson(cacheKey, payload, 30);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const event = await db('events').where({ id: req.params.id }).whereNull('deleted_at').first();
    if (!event) return res.status(404).json({ error: 'Событие не найдено.' });

    const seats = (await db('seats').where({ event_id: req.params.id }).select()).map(normalizeSeat);
    const summary = seats.reduce(
      (acc, seat) => {
        acc.total += 1;
        acc[seat.status] += 1;
        return acc;
      },
      { total: 0, available: 0, locked: 0, sold: 0 }
    );

    res.json({ ...event, price: Number(event.price), seats: summary });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/seats', async (req, res, next) => {
  try {
    const cacheKey = `event:${req.params.id}:seats`;
    const cached = await getJson(cacheKey);
    if (cached) return res.json(cached);

    const event = await db('events').where({ id: req.params.id }).whereNull('deleted_at').first();
    if (!event) return res.status(404).json({ error: 'Событие не найдено.' });

    const seats = (await db('seats').where({ event_id: req.params.id }).orderBy(['row_label', 'seat_number']).select()).map(normalizeSeat);
    await setJson(cacheKey, seats, 30);
    res.json(seats);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, requireRole('manager', 'admin'), async (req, res, next) => {
  try {
    const event = await db('events').where({ id: req.params.id }).whereNull('deleted_at').first();
    if (!event) return res.status(404).json({ error: 'Событие не найдено.' });
    if (req.user.role !== 'admin' && Number(event.created_by) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Недостаточно прав.' });
    }

    const confirmedBooking = await db('bookings').where({ event_id: req.params.id, status: 'confirmed' }).first();
    if (confirmedBooking) {
      const error = new Error('Нельзя изменить событие с подтвержденными заказами.');
      error.status = 409;
      throw error;
    }

    const payload = eventPayload(req.body);
    if (payload.price !== undefined) payload.price = Number(payload.price);
    const [updated] = await db('events').where({ id: req.params.id }).update(payload).returning('*');
    await deleteByPattern('events:*');
    await deleteByPattern(`event:${req.params.id}:seats*`);
    res.json({ ...updated, price: Number(updated.price) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const [deleted] = await db('events')
      .where({ id: req.params.id })
      .whereNull('deleted_at')
      .update({ deleted_at: new Date() })
      .returning('*');
    if (!deleted) return res.status(404).json({ error: 'Событие не найдено.' });
    await deleteByPattern('events:*');
    await deleteByPattern(`event:${req.params.id}:seats*`);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
