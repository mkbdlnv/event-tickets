import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import BookingSteps from '../components/BookingSteps.jsx';
import { apiError, bookingsApi } from '../api/index.js';
import { useBooking } from '../state.jsx';

function secondsLeft(expiresAt) {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function ConfirmPage() {
  const navigate = useNavigate();
  const { draft, setDraft } = useBooking();
  const [card, setCard] = useState('');
  const [remaining, setRemaining] = useState(secondsLeft(draft.expiresAt));
  const [confirmation, setConfirmation] = useState(null);
  const total = useMemo(() => Number(draft.event.price) * draft.seats.length, [draft]);
  const confirmMutation = useMutation({
    mutationFn: () => bookingsApi.confirm({ event_id: draft.event.id, seat_ids: draft.seatIds }),
    onSuccess(data) {
      setConfirmation(data);
      setDraft(null);
    }
  });

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(secondsLeft(draft.expiresAt)), 1000);
    return () => window.clearInterval(timer);
  }, [draft.expiresAt]);

  if (confirmation) {
    return (
      <main className="page narrow">
        <BookingSteps done />
        <section className="success-panel">
          <h1>Бронирование подтверждено</h1>
          <p>Номер заказа: #{confirmation.booking_id}</p>
          <Link className="primary link-button" to="/bookings/history">Посмотреть мои заказы</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page narrow">
      <BookingSteps />
      <section className="confirm-panel">
        <h1>Подтверждение заказа</h1>
        {remaining > 0 ? <div className="timer">Ваш выбор истекает через {formatTime(remaining)}</div> : <div className="error">Время выбора истекло. Вернитесь к выбору мест.</div>}
        {confirmMutation.error && <div className="error">{apiError(confirmMutation.error)} <Link to={`/events/${draft.event.id}/seats`}>Вернуться к местам</Link></div>}
        <h2>{draft.event.title}</h2>
        <p>{new Date(draft.event.starts_at).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' })} · {draft.event.venue}</p>
        <ul className="seat-list">
          {draft.seats.map((seat) => <li key={seat.id}>Ряд {seat.row_label}, место {seat.seat_number} · {Number(draft.event.price).toLocaleString('ru-RU')} KZT</li>)}
        </ul>
        <strong className="total">Итого: {total.toLocaleString('ru-RU')} KZT</strong>
        <label>Номер карты<input value={card} onChange={(e) => setCard(e.target.value)} inputMode="numeric" placeholder="0000 0000 0000 0000" /></label>
        <button className="primary" disabled={remaining <= 0 || confirmMutation.isPending} onClick={() => confirmMutation.mutate()}>
          {confirmMutation.isPending ? 'Оплачиваем...' : `Оплатить ${total.toLocaleString('ru-RU')} KZT`}
        </button>
        <button className="ghost" onClick={() => navigate(`/events/${draft.event.id}/seats`)}>Вернуться к местам</button>
      </section>
    </main>
  );
}
