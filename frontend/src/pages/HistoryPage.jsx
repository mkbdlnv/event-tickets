import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import BookingSteps from '../components/BookingSteps.jsx';
import { bookingsApi } from '../api/index.js';

export default function HistoryPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['history'], queryFn: bookingsApi.history });

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
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
