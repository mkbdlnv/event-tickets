import express from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { confirmBooking, lockSeats, releaseLocks } from '../services/bookingService.js';

const router = express.Router();

router.use(requireAuth);

router.post('/lock', async (req, res, next) => {
  try {
    const result = await lockSeats(req.user.id, req.body.event_id, req.body.seat_ids);
    res.json({ locked_seats: result.lockedSeats, expires_at: result.expiresAt });
  } catch (error) {
    next(error);
  }
});

router.post('/confirm', async (req, res, next) => {
  try {
    const result = await confirmBooking(req.user.id, req.body.event_id, req.body.seat_ids);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const rows = await db('bookings')
      .join('events', 'bookings.event_id', 'events.id')
      .leftJoin('booking_items', 'bookings.id', 'booking_items.booking_id')
      .leftJoin('seats', 'booking_items.seat_id', 'seats.id')
      .where('bookings.user_id', req.user.id)
      .orderBy('bookings.created_at', 'desc')
      .select(
        'bookings.id as booking_id',
        'bookings.total_price',
        'bookings.status',
        'bookings.created_at',
        'events.id as event_id',
        'events.title',
        'events.venue',
        'events.city',
        'events.starts_at',
        'seats.id as seat_id',
        'seats.row_label',
        'seats.seat_number'
      );

    const grouped = rows.reduce((acc, row) => {
      if (!acc.has(row.booking_id)) {
        acc.set(row.booking_id, {
          booking_id: row.booking_id,
          total_price: Number(row.total_price),
          status: row.status,
          created_at: row.created_at,
          event: {
            id: row.event_id,
            title: row.title,
            venue: row.venue,
            city: row.city,
            starts_at: row.starts_at
          },
          seats: []
        });
      }
      if (row.seat_id) {
        acc.get(row.booking_id).seats.push({
          id: row.seat_id,
          row_label: row.row_label,
          seat_number: row.seat_number
        });
      }
      return acc;
    }, new Map());

    res.json([...grouped.values()]);
  } catch (error) {
    next(error);
  }
});

router.delete('/lock', async (req, res, next) => {
  try {
    res.json(await releaseLocks(req.user.id, req.body.seat_ids));
  } catch (error) {
    next(error);
  }
});

export default router;
