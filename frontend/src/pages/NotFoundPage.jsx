import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="page narrow">
      <section className="success-panel">
        <h1>Страница не найдена</h1>
        <p>Такого раздела нет или ссылка устарела.</p>
        <Link className="primary link-button" to="/events">Вернуться к афише</Link>
      </section>
    </main>
  );
}
