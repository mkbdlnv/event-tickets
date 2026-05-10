import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import EventCard from '../components/EventCard.jsx';
import BookingSteps from '../components/BookingSteps.jsx';
import { eventsApi } from '../api/index.js';
import { useAuth } from '../state.jsx';

export default function EventsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState({ category: '', city: 'Almaty', search: '', page: 1 });
  const params = { ...filters, limit: 9 };
  const { data, isLoading, error } = useQuery({ queryKey: ['events', params], queryFn: () => eventsApi.list(params) });

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1>Афиша событий</h1>
          <p>Выберите событие, места и подтвердите оплату.</p>
        </div>
        <nav>
          {user ? <Link to="/bookings/history">Мои заказы</Link> : <Link to="/login">Войти</Link>}
        </nav>
      </header>
      <BookingSteps />
      <section className="filters">
        <select value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}>
          <option value="">Все категории</option>
          <option value="movie">Кино</option>
          <option value="concert">Концерт</option>
          <option value="sport">Спорт</option>
        </select>
        <input value={filters.city} onChange={(e) => updateFilter('city', e.target.value)} placeholder="Город" />
        <input value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="Поиск по названию" />
      </section>
      {isLoading && <div className="notice">Загружаем события...</div>}
      {error && <div className="error">Не удалось загрузить события.</div>}
      <section className="event-grid">
        {data?.data.map((event) => <EventCard key={event.id} event={event} onClick={() => navigate(`/events/${event.id}/seats`)} />)}
      </section>
      {data && (
        <div className="pagination">
          <button disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Назад</button>
          <span>{data.pagination.page} / {Math.max(data.pagination.totalPages, 1)}</span>
          <button disabled={filters.page >= data.pagination.totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Вперед</button>
        </div>
      )}
    </main>
  );
}
