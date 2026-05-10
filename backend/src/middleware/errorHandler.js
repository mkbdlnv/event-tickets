export function errorHandler(error, req, res, next) {
  const status = error.status || 500;
  const message = status >= 500 ? 'Что-то пошло не так. Попробуйте позже.' : error.message;

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({ error: message });
}
