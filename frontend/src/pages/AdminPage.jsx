import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiError, eventsApi } from '../api/index.js';
import { useAuth } from '../state.jsx';

const emptyForm = {
  title: '',
  description: '',
  category: 'movie',
  venue: '',
  city: 'Almaty',
  starts_at: '',
  price: '',
  rows: 5,
  seats_per_row: 10
};

function toLocalInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function eventPayload(form) {
  return {
    title: form.title,
    description: form.description,
    category: form.category,
    venue: form.venue,
    city: form.city,
    starts_at: new Date(form.starts_at).toISOString(),
    price: Number(form.price)
  };
}

function EventForm({ initial = emptyForm, submitLabel, onSubmit, loading }) {
  const [form, setForm] = useState(initial);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <label>Название<input required value={form.title} onChange={(e) => update('title', e.target.value)} /></label>
      <label>Описание<textarea value={form.description} onChange={(e) => update('description', e.target.value)} /></label>
      <label>Категория<select value={form.category} onChange={(e) => update('category', e.target.value)}><option value="movie">Кино</option><option value="concert">Концерт</option><option value="sport">Спорт</option></select></label>
      <label>Площадка<input required value={form.venue} onChange={(e) => update('venue', e.target.value)} /></label>
      <label>Город<input required value={form.city} onChange={(e) => update('city', e.target.value)} /></label>
      <label>Дата и время<input required type="datetime-local" value={form.starts_at} onChange={(e) => update('starts_at', e.target.value)} /></label>
      <label>Цена<input required type="number" min="0" value={form.price} onChange={(e) => update('price', e.target.value)} /></label>
      {'rows' in form && <label>Рядов<input type="number" min="1" max="10" value={form.rows} onChange={(e) => update('rows', Number(e.target.value))} /></label>}
      {'seats_per_row' in form && <label>Мест в ряду<input type="number" min="1" max="20" value={form.seats_per_row} onChange={(e) => update('seats_per_row', Number(e.target.value))} /></label>}
      <button className="primary" disabled={loading}>{loading ? <span className="spinner-label"><i className="spinner" /> Обработка...</span> : submitLabel}</button>
    </form>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('events');
  const [editingId, setEditingId] = useState(null);
  const [created, setCreated] = useState(null);
  const { data = [], isLoading } = useQuery({ queryKey: ['my-events'], queryFn: eventsApi.mine });

  const createMutation = useMutation({
    mutationFn: (form) => eventsApi.create({
      ...eventPayload(form),
      seat_config: {
        rows: Array.from({ length: Number(form.rows) }, (_, index) => String.fromCharCode(65 + index)),
        seats_per_row: Number(form.seats_per_row)
      }
    }),
    onSuccess(event) {
      setCreated(event);
      toast.success('Событие создано');
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError(error) {
      toast.error(apiError(error));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, form }) => eventsApi.update(id, eventPayload(form)),
    onSuccess() {
      setEditingId(null);
      toast.success('Событие обновлено');
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError(error) {
      toast.error(apiError(error));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: eventsApi.remove,
    onSuccess() {
      toast.success('Событие удалено');
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError(error) {
      toast.error(apiError(error));
    }
  });

  return (
    <main className="page">
      <header className="topbar">
        <div><h1>Панель управления</h1><p>Создание и редактирование событий.</p></div>
        <Link to="/events">К афише</Link>
      </header>
      <div className="tabs">
        <button className={tab === 'events' ? 'active' : ''} onClick={() => setTab('events')}>Мои события</button>
        <button className={tab === 'create' ? 'active' : ''} onClick={() => setTab('create')}>Создать событие</button>
      </div>

      {tab === 'create' && (
        <section className="admin-panel">
          {created && <div className="notice">Событие создано: <Link to={`/events/${created.id}/seats`}>{created.title}</Link></div>}
          <EventForm submitLabel="Создать событие" onSubmit={(form) => createMutation.mutate(form)} loading={createMutation.isPending} />
        </section>
      )}

      {tab === 'events' && (
        <section className="admin-panel">
          {isLoading && <div className="notice">Загружаем события...</div>}
          {!isLoading && data.length === 0 && <div className="empty-state">У вас пока нет созданных событий.</div>}
          {data.length > 0 && (
            <div className="admin-table">
              {data.map((event) => (
                <article className="admin-row" key={event.id}>
                  {editingId === event.id ? (
                    <EventForm
                      initial={{
                        title: event.title,
                        description: event.description || '',
                        category: event.category,
                        venue: event.venue,
                        city: event.city,
                        starts_at: toLocalInputValue(event.starts_at),
                        price: event.price
                      }}
                      submitLabel="Сохранить"
                      loading={updateMutation.isPending}
                      onSubmit={(form) => updateMutation.mutate({ id: event.id, form })}
                    />
                  ) : (
                    <>
                      <div><h2>{event.title}</h2><p>{event.category} · {new Date(event.starts_at).toLocaleString('ru-RU')} · {event.venue}</p></div>
                      <div><strong>{event.price.toLocaleString('ru-RU')} KZT</strong><p>{event.available_seats}/{event.total_seats} мест</p></div>
                      <div className="row-actions">
                        <button className="ghost" onClick={() => setEditingId(event.id)}>Редактировать</button>
                        {user.role === 'admin' && <button className="danger" onClick={() => window.confirm('Удалить событие?') && deleteMutation.mutate(event.id)}>Удалить</button>}
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
