import axios from 'axios';
import type {
  AdminStats, AdminReview, AdminQuestion, AdminUser, AdminProfile, QuestionStatus,
  AdminMeta, AdminNews, AdminEvent, AdminFAQItem, AdminCategory, AdminDocument,
  AdminContact, AdminSlider, AdminStaffMember, AdminPage, AdminPageImage,
  AdminGroup, AdminGroupStaff, AdminCircle, AdminCircleBenefit, AdminCircleSession,
  AdminDailyMenu, AdminMenuTemplate, AdminGalleryAlbum, AdminGalleryPhoto,
  AdminFlatRow, AdminAttestationSettings, AdminSpecialistPage, AdminSpecialist,
  AdminSpecialistSection, AdminSpecialistSectionPhoto,
  AdminAccount, AdminHistoryItem, AdminPushStats, AdminAISettings,
  AdminEnrollment, EnrollmentStatus, AdminTourStop,
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
  login: (username: string, password: string, otp_token?: string) =>
    http.post<{ token: string; user: AdminUser }>('/auth/login/', { username, password, otp_token }).then(r => r.data),
  logout: () => http.post('/auth/logout/').then(r => r.data),
  me: () => http.get<{ user: AdminUser }>('/auth/me/').then(r => r.data),
};

// Власний профіль + 2FA
export const adminProfileApi = {
  get: () => http.get<AdminProfile>('/profile/').then(r => r.data),
  update: (data: object) => http.patch<AdminProfile>('/profile/', data).then(r => r.data),
  changePassword: (old_password: string, new_password: string) =>
    http.post<{ detail: string }>('/change-password/', { old_password, new_password }).then(r => r.data),
};
export const admin2faApi = {
  setup: () => http.post<{ config_url: string }>('/2fa/setup/').then(r => r.data),
  confirm: (token: string) => http.post<{ has_2fa: boolean }>('/2fa/confirm/', { token }).then(r => r.data),
  disable: (password: string) => http.post<{ has_2fa: boolean }>('/2fa/disable/', { password }).then(r => r.data),
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

export const adminEnrollmentApi = {
  list: (status: string) => http.get<AdminEnrollment[]>('/enrollment/', { params: { status } }).then(r => r.data),
  update: (id: number, data: Partial<{ status: EnrollmentStatus; admin_note: string }>) =>
    http.patch<AdminEnrollment>(`/enrollment/${id}/`, data).then(r => r.data),
  remove: (id: number) => http.delete(`/enrollment/${id}/`).then(r => r.data),
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
export const adminTourApi = crud<AdminTourStop>('tour');

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

// Батькам — 5 пласких списків
export const adminParentsAnnouncementsApi = crud<AdminFlatRow>('parents-announcements');
export const adminParentsDocumentsApi = crud<AdminFlatRow>('parents-documents');
export const adminParentsAdaptationApi = crud<AdminFlatRow>('parents-adaptation');
export const adminParentsEnrollmentApi = crud<AdminFlatRow>('parents-enrollment');
export const adminParentsSamplesApi = crud<AdminFlatRow>('parents-samples');

// Атестація — 4 списки + налаштування (singleton)
export const adminAttestationDocumentsApi = crud<AdminFlatRow>('attestation-documents');
export const adminAttestationStepsApi = crud<AdminFlatRow>('attestation-steps');
export const adminAttestationCategoriesApi = crud<AdminFlatRow>('attestation-categories');
export const adminAttestationLawsApi = crud<AdminFlatRow>('attestation-laws');
export const adminAttestationSettingsApi = {
  get: () => http.get<AdminAttestationSettings>('/attestation-settings/').then(r => r.data),
  update: (data: FormData | object) => http.patch<AdminAttestationSettings>('/attestation-settings/', data).then(r => r.data),
};

// Спеціалісти — master-detail
export const adminSpecialistPagesApi = crud<AdminSpecialistPage>('specialist-pages');
export const adminSpecialistPeopleApi = childApi<AdminSpecialist>('specialist-people', 'page');
export const adminSpecialistAlbumsApi = childApi<AdminFlatRow>('specialist-albums', 'specialist');
export const adminSpecialistSectionsApi = childApi<AdminSpecialistSection>('specialist-sections', 'page');
export const adminSpecialistSectionPhotosApi = childApi<AdminSpecialistSectionPhoto>('specialist-section-photos', 'section');

// Системне (Фаза 9): користувачі, історія, push-розсилка
export const adminUsersApi = {
  ...crud<AdminAccount>('users'),
  setPassword: (id: number, password: string) =>
    http.post<{ detail: string }>(`/users/${id}/set_password/`, { password }).then(r => r.data),
};
export const adminHistoryApi = {
  list: () => http.get<{ items: AdminHistoryItem[] }>('/history/').then(r => r.data.items),
};
export const adminPushApi = {
  subscriptions: () => http.get<AdminPushStats>('/push/subscriptions/').then(r => r.data),
  send: (data: { title: string; body: string; topic: string; url?: string }) =>
    http.post<{ sent: number }>('/push/send/', data).then(r => r.data),
};

// ШІ (Gemini): авто-модерація відгуків + генерація тексту
export const adminAiApi = {
  settings: () => http.get<AdminAISettings>('/ai-settings/').then(r => r.data),
  updateSettings: (data: Partial<AdminAISettings>) => http.patch<AdminAISettings>('/ai-settings/', data).then(r => r.data),
  generate: (brief: string, kind: string, tone: string = 'warm') => http.post<{ text: string }>('/ai-generate/', { brief, kind, tone }).then(r => r.data),
  upcomingHoliday: () => http.get<{ name: string, date: string, days_until: number } | null>('/upcoming-holiday/').then(r => r.data),
};

// Типи подій (редагований довідник)
export const adminEventTypesApi = crud<AdminCategory>('event-types');

// Аналітика чатів ШІ
export interface AdminChatLog {
  id: number;
  question: string;
  sources_found: boolean;
  created_at: string;
}

export const adminChatLogsApi = {
  list: () => http.get<AdminChatLog[]>('/chat-logs/').then(r => r.data),
  analyze: (days: number, hide_answered: boolean) => 
    http.post<{ report: string }>('/chat-logs/analyze/', { days, hide_answered }).then(r => r.data),
};
