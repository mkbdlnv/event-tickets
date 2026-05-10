import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const [, token] = header.split(' ');

  if (!token) {
    return res.status(401).json({ error: 'Нужна авторизация.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: Number(payload.sub), email: payload.email, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: 'Сессия истекла. Войдите снова.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав.' });
    }
    return next();
  };
}
