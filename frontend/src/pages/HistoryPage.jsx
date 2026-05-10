import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import BookingSteps from '../components/BookingSteps.jsx';
import { apiError, bookingsApi } from '../api/index.js';

function canCancel(booking) {
  return booking.status === 'confirmed' && new Date(booking.event.starts_at).getTime() - Date.now() > 24 * 60 * 60 * 1000;
}

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['history'], queryFn: bookingsApi.history });
  const cancelMutation = useMutation({
    mutationFn: bookingsApi.cancel,
    onSuccess() {
      toast.success('Бронирование отменено');
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError(err) {
      toast.error(apiError(err));
    }
  });

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1>Мои заказы</h1>
          <p>История подтвержденных бронирований.</p>
        </div>
        <Link to="/events">К афише</Link>
      </header>
      <BookingSteps done />
      {isLoading && <div className="notice">Загружаем заказы...</div>}
      {error && <div className="error">Войдите в аккаунт, чтобы увидеть заказы.</div>}
      {!isLoading && !error && data?.length === 0 && <div className="empty-state">Вы еще не бронировали билеты. <Link to="/events">Смотреть афишу →</Link></div>}
      <section className="history-list">
        {data?.map((booking) => (
          <article className="history-card" key={booking.booking_id}>
            <div>
              <h2>Заказ #{booking.booking_id}</h2>
              <p>{booking.event.title} · {new Date(booking.event.starts_at).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              <p>{booking.event.venue}, {booking.event.city}</p>
            </div>
            <div>
              <strong>{booking.total_price.toLocaleString('ru-RU')} KZT</strong>
              <p>{booking.seats.map((seat) => `${seat.row_label}${seat.seat_number}`).join(', ')}</p>
              <p className={`status ${booking.status}`}>{booking.status === 'cancelled' ? 'Отменено' : 'Подтверждено'}</p>
              {canCancel(booking) && (
                <button
                  className="danger"
                  disabled={cancelMutation.isPending}
                  onClick={() => window.confirm('Вы уверены, что хотите отменить заказ? Это действие нельзя отменить.') && cancelMutation.mutate(booking.booking_id)}
                >
                  Отменить
                </button>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
