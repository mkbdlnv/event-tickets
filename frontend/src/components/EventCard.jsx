import React from 'react';
import { CalendarDays, MapPin } from 'lucide-react';

const labels = {
  movie: 'Кино',
  concert: 'Концерт',
  sport: 'Спорт'
};

export default function EventCard({ event, onClick }) {
  return (
    <button className="event-card" onClick={onClick}>
      <div className={`badge ${event.category}`}>{labels[event.category]}</div>
      <h2>{event.title}</h2>
      <p>{event.description}</p>
      <div className="meta">
        <CalendarDays size={18} />
        <span>{new Date(event.starts_at).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })}</span>
      </div>
      <div className="meta">
        <MapPin size={18} />
        <span>
          {event.venue}, {event.city}
        </span>
      </div>
      <div className="card-footer">
        <strong>{Number(event.price).toLocaleString('ru-RU')} KZT</strong>
        <span>{event.available_seats} мест доступно</span>
      </div>
    </button>
  );
}
