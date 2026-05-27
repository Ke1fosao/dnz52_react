import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  // withCredentials=false бо ми не використовуємо session-based auth,
  // це дозволяє POST без CSRF токена з React
  withCredentials: false,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 404) {
      console.warn('[API] Not found:', error.config?.url);
    } else if (error.response?.status >= 500) {
      console.error('[API] Server error:', error.response?.data);
    }
    return Promise.reject(error);
  },
);
