import express from 'express';
import db from '../db/index.js';
import { getJson, setJson } from '../services/cacheService.js';

const router = express.Router();

function normalizeSeat(seat) {
  if (seat.status === 'locked' && seat.locked_until && new Date(seat.locked_until) < new Date()) {
    return { ...seat, status: 'available', locked_until: null, locked_by: null };
  }
  return seat;
}

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

    if (req.query.category) query.where('events.category', req.query.category);
    if (req.query.city) query.whereILike('events.city', `%${req.query.city}%`);
    if (req.query.search) {
      query.where((builder) => {
        builder.whereILike('events.title', `%${req.query.search}%`).orWhereILike('events.description', `%${req.query.search}%`);
      });
    }

    const countQuery = db('events').count({ count: 'id' });
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
    const event = await db('events').where({ id: req.params.id }).first();
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

    const seats = (await db('seats').where({ event_id: req.params.id }).orderBy(['row_label', 'seat_number']).select()).map(normalizeSeat);
    await setJson(cacheKey, seats, 30);
    res.json(seats);
  } catch (error) {
    next(error);
  }
});

export default router;
