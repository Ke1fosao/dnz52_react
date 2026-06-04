import axios from 'axios';
import type { AdminStats, AdminReview, AdminQuestion, AdminUser, QuestionStatus } from '../types';

const TOKEN_KEY = 'dnz52:adminToken';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const http = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '/api/v1') + '/admin',
});

http.interceptors.request.use(cfg => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Token ${t}`;
  return cfg;
});

// Протух токен / немає доступу → на сторінку входу
http.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      clearToken();
      if (!window.location.pathname.endsWith('/manage/login')) {
        window.location.href = '/manage/login';
      }
    }
    return Promise.reject(err);
  },
);

export const adminAuthApi = {
  login: (username: string, password: string) =>
    http.post<{ token: string; user: AdminUser }>('/auth/login/', { username, password }).then(r => r.data),
  logout: () => http.post('/auth/logout/').then(r => r.data),
  me: () => http.get<{ user: AdminUser }>('/auth/me/').then(r => r.data),
};

export const adminStatsApi = {
  get: () => http.get<AdminStats>('/stats/').then(r => r.data),
};

export const adminReviewsApi = {
  list: (status: string) => http.get<AdminReview[]>('/reviews/', { params: { status } }).then(r => r.data),
  approve: (id: number) => http.post<AdminReview>(`/reviews/${id}/approve/`).then(r => r.data),
  unpublish: (id: number) => http.post<AdminReview>(`/reviews/${id}/unpublish/`).then(r => r.data),
  reply: (id: number, reply: string) => http.post<AdminReview>(`/reviews/${id}/reply/`, { reply }).then(r => r.data),
  remove: (id: number) => http.delete(`/reviews/${id}/`).then(r => r.data),
};

export const adminQuestionsApi = {
  list: (status: string) => http.get<AdminQuestion[]>('/questions/', { params: { status } }).then(r => r.data),
  update: (id: number, data: Partial<{ status: QuestionStatus; admin_note: string; callback_date: string | null }>) =>
    http.patch<AdminQuestion>(`/questions/${id}/`, data).then(r => r.data),
  remove: (id: number) => http.delete(`/questions/${id}/`).then(r => r.data),
};
