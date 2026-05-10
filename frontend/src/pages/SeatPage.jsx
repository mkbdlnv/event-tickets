import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import BookingSteps from '../components/BookingSteps.jsx';
import SeatMap from '../components/SeatMap.jsx';
import { apiError, bookingsApi, eventsApi } from '../api/index.js';
import { useAuth, useBooking } from '../state.jsx';

function secondsLeft(expiresAt) {
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function SeatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { draft, setDraft } = useBooking();
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState(0);
  const eventQuery = useQuery({ queryKey: ['event', id], queryFn: () => eventsApi.details(id) });
  const seatsQuery = useQuery({ queryKey: ['seats', id], queryFn: () => eventsApi.seats(id), refetchInterval: 30000 });
  const selectedSeats = useMemo(() => (seatsQuery.data || []).filter((seat) => selected.includes(seat.id)), [seatsQuery.data, selected]);
  const lockMutation = useMutation({
    mutationFn: () => bookingsApi.lock({ event_id: Number(id), seat_ids: selected }),
    onSuccess(data) {
      setDraft({ event: eventQuery.data, seats: selectedSeats, seatIds: selected, expiresAt: data.expires_at });
      navigate('/bookings/confirm');
    },
    onError(err) {
      setError(apiError(err));
      seatsQuery.refetch();
    }
  });

  useEffect(() => {
    if (!draft || Number(draft.event.id) !== Number(id)) return undefined;
    setRemaining(secondsLeft(draft.expiresAt));
    const timer = window.setInterval(() => setRemaining(secondsLeft(draft.expiresAt)), 1000);
    return () => window.clearInterval(timer);
  }, [draft, id]);

  function toggleSeat(seat) {
    setError('');
    setSelected((current) => {
      if (current.includes(seat.id)) return current.filter((id) => id !== seat.id);
      if (current.length >= 6) {
        setError('Можно выбрать не больше 6 мест.');
        return current;
      }
      return [...current, seat.id];
    });
  }

  if (eventQuery.isLoading || seatsQuery.isLoading) return <main className="page"><div className="notice">Загружаем зал...</div></main>;

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1>{eventQuery.data.title}</h1>
          <p>{new Date(eventQuery.data.starts_at).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' })} · {eventQuery.data.venue} · {Number(eventQuery.data.price).toLocaleString('ru-RU')} KZT</p>
        </div>
        <Link to="/events">К афише</Link>
      </header>
      <BookingSteps />
      {remaining > 0 && <div className="timer">Ваш выбор истекает через {formatTime(remaining)}</div>}
      {error && <div className="error">{error}</div>}
      <SeatMap seats={seatsQuery.data || []} selectedIds={selected} onToggle={toggleSeat} />
      <div className="action-bar">
        <span>Выбрано мест: {selected.length}</span>
        <button className="primary" disabled={!selected.length || lockMutation.isPending} onClick={() => user ? lockMutation.mutate() : navigate('/login')}>
          {lockMutation.isPending ? 'Бронируем...' : 'Забронировать выбранные места'}
        </button>
      </div>
    </main>
  );
}
