import axios from 'axios';
import type {
  AdminStats, AdminReview, AdminQuestion, AdminUser, QuestionStatus,
  AdminMeta, AdminNews, AdminEvent, AdminFAQItem, AdminCategory, AdminDocument,
  AdminContact, AdminSlider, AdminStaffMember, AdminPage, AdminPageImage,
  AdminGroup, AdminGroupStaff, AdminCircle, AdminCircleBenefit, AdminCircleSession,
  AdminDailyMenu, AdminMenuTemplate, AdminGalleryAlbum, AdminGalleryPhoto,
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

// Дочірній CRUD (інлайни): list фільтрується за батьком (?<parentParam>=id)
function childApi<T>(path: string, parentParam: string) {
  return {
    ...crud<T>(path),
    listFor: (parentId: number) => http.get<T[]>(`/${path}/`, { params: { [parentParam]: parentId } }).then(r => r.data),
  };
}

export const adminGroupsApi = crud<AdminGroup>('groups');
export const adminGroupStaffApi = childApi<AdminGroupStaff>('group-staff', 'group');
export const adminCirclesApi = crud<AdminCircle>('circles');
export const adminCircleBenefitsApi = childApi<AdminCircleBenefit>('circle-benefits', 'circle');
export const adminCircleSessionsApi = childApi<AdminCircleSession>('circle-sessions', 'circle');

// Меню: денні меню (CRUD + копіювання на тиждень вперед)
export const adminDailyMenuApi = {
  ...crud<AdminDailyMenu>('menu'),
  duplicateNextWeek: (id: number) =>
    http.post<AdminDailyMenu>(`/menu/${id}/duplicate_next_week/`).then(r => r.data),
};

// Шаблон тижня-основи: завжди 7 днів, зберігаються разом (PUT-ом)
export const adminMenuTemplatesApi = {
  get: () => http.get<AdminMenuTemplate[]>('/menu-templates/').then(r => r.data),
  save: (items: Partial<AdminMenuTemplate>[]) =>
    http.put<AdminMenuTemplate[]>('/menu-templates/', items).then(r => r.data),
};

// Галерея: альбоми + фото (масове завантаження з прогресом, поворот, сортування)
export const adminGalleryAlbumsApi = crud<AdminGalleryAlbum>('gallery-albums');
export const adminGalleryPhotosApi = {
  ...crud<AdminGalleryPhoto>('gallery-photos'),
  listFor: (albumId: number) =>
    http.get<AdminGalleryPhoto[]>('/gallery-photos/', { params: { album: albumId } }).then(r => r.data),
  bulkUpload: (albumId: number, files: FileList | File[], onProgress?: (pct: number) => void) => {
    const fd = new FormData();
    fd.append('album', String(albumId));
    Array.from(files).forEach(f => fd.append('images', f));
    return http.post<AdminGalleryPhoto[]>('/gallery-photos/bulk_upload/', fd, {
      onUploadProgress: e => { if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100)); },
    }).then(r => r.data);
  },
  rotate: (id: number, direction: 'cw' | 'ccw') =>
    http.post<AdminGalleryPhoto>(`/gallery-photos/${id}/rotate/`, { direction }).then(r => r.data),
};
