import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi, apiError } from '../api/index.js';
import { useAuth } from '../state.jsx';

export default function RegisterPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ display_name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Введите корректный email.';
    if (form.password.length < 8) return 'Пароль должен быть не короче 8 символов.';
    if (form.password !== form.confirm) return 'Пароли не совпадают.';
    return '';
  }

  async function submit(event) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) return setError(validationError);
    setError('');
    setLoading(true);
    try {
      const data = await authApi.register({
        display_name: form.display_name,
        email: form.email,
        password: form.password
      });
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
        <h1>Регистрация</h1>
        {error && <div className="error">{error}</div>}
        <label>Имя<input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} required /></label>
        <label>Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" required /></label>
        <label>
          Пароль
          <div className="password-field">
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type={showPassword ? 'text' : 'password'} required />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Показать пароль">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        <label>Повторите пароль<input value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} type={showPassword ? 'text' : 'password'} required /></label>
        <button className="primary" disabled={loading}>{loading ? 'Создаем...' : 'Создать аккаунт'}</button>
        <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
      </form>
    </main>
  );
}
