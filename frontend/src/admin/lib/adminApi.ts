import axios from 'axios';
import type {
  AdminStats, AdminReview, AdminQuestion, AdminUser, QuestionStatus,
  AdminMeta, AdminNews, AdminEvent, AdminFAQItem, AdminCategory, AdminDocument,
  AdminContact, AdminSlider, AdminStaffMember, AdminPage, AdminPageImage,
} from '../types';

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

export const adminMetaApi = {
  get: () => http.get<AdminMeta>('/meta/').then(r => r.data),
};

// Універсальний CRUD-клієнт для контенту (FormData або JSON)
function crud<T>(path: string) {
  return {
    list: () => http.get<T[]>(`/${path}/`).then(r => r.data),
    get: (id: number | string) => http.get<T>(`/${path}/${id}/`).then(r => r.data),
    create: (data: FormData | object) => http.post<T>(`/${path}/`, data).then(r => r.data),
    update: (id: number | string, data: FormData | object) => http.patch<T>(`/${path}/${id}/`, data).then(r => r.data),
    remove: (id: number | string) => http.delete(`/${path}/${id}/`).then(r => r.data),
  };
}

export const adminNewsApi = crud<AdminNews>('news');
export const adminEventsApi = crud<AdminEvent>('events');
export const adminFaqItemsApi = crud<AdminFAQItem>('faq-items');

export const adminDocumentsApi = crud<AdminDocument>('documents');
export const adminNewsCategoriesApi = crud<AdminCategory>('news-categories');
export const adminNewsTagsApi = crud<AdminCategory>('news-tags');
export const adminGalleryCategoriesApi = crud<AdminCategory>('gallery-categories');
export const adminDocumentCategoriesApi = crud<AdminCategory>('document-categories');
export const adminFaqCategoriesApi = crud<AdminCategory>('faq-categories');

export const adminSlidersApi = crud<AdminSlider>('sliders');
export const adminStaffApi = crud<AdminStaffMember>('staff');
export const adminPagesApi = crud<AdminPage>('pages');
export const adminPageImagesApi = {
  ...crud<AdminPageImage>('page-images'),
  listFor: (pageId: number) => http.get<AdminPageImage[]>('/page-images/', { params: { page: pageId } }).then(r => r.data),
};

export const adminContactApi = {
  get: () => http.get<AdminContact>('/contact/').then(r => r.data),
  update: (data: FormData | object) => http.patch<AdminContact>('/contact/', data).then(r => r.data),
};
