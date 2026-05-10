import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi, apiError } from '../api/index.js';
import { useAuth } from '../state.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(form);
      auth.signIn(data);
      navigate('/events');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-panel" onSubmit={submit}>
        <h1>Вход</h1>
        {error && <div className="error">{error}</div>}
        <label>Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" required /></label>
        <label>Пароль<input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" required /></label>
        <button className="primary" disabled={loading}>{loading ? 'Входим...' : 'Войти'}</button>
        <p>Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></p>
      </form>
    </main>
  );
}
