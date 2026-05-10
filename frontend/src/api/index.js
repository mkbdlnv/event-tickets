import axios from 'axios';

let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original?._retry || original?.url?.includes('/api/auth/refresh')) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      refreshPromise = refreshPromise || api.post('/api/auth/refresh');
      const { data } = await refreshPromise;
      setAccessToken(data.accessToken);
      refreshPromise = null;
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (refreshError) {
      refreshPromise = null;
      setAccessToken(null);
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
);

export const authApi = {
  register: (payload) => api.post('/api/auth/register', payload).then((res) => res.data),
  login: (payload) => api.post('/api/auth/login', payload).then((res) => res.data),
  logout: () => api.post('/api/auth/logout').then((res) => res.data)
};

export const eventsApi = {
  list: (params) => api.get('/api/events', { params }).then((res) => res.data),
  details: (id) => api.get(`/api/events/${id}`).then((res) => res.data),
  seats: (id) => api.get(`/api/events/${id}/seats`).then((res) => res.data)
};

export const bookingsApi = {
  lock: (payload) => api.post('/api/bookings/lock', payload).then((res) => res.data),
  confirm: (payload) => api.post('/api/bookings/confirm', payload).then((res) => res.data),
  history: () => api.get('/api/bookings/history').then((res) => res.data),
  release: (payload) => api.delete('/api/bookings/lock', { data: payload }).then((res) => res.data)
};

export function apiError(error) {
  return error.response?.data?.error || 'Не удалось выполнить запрос. Попробуйте еще раз.';
}
