import { api } from './client';
import type {
  PaginatedResponse,
  Page, PageListItem, Slider, Contact,
  ParentsAnnouncement, ParentsDocument, ParentsAdaptationPhoto,
  ParentsEnrollmentDoc, ParentsApplicationSample,
  StaffMember,
  AttestationDocument, AttestationStep, AttestationCategory,
  AttestationLaw, AttestationSettings,
  NewsCategory, NewsListItem, NewsDetail,
  GalleryCategory, GalleryAlbumListItem, GalleryAlbumDetail,
  GroupListItem, GroupDetail,
  SpecialistPage, SpecialistPageType,
  CircleListItem, CircleDetail,
  DocumentCategory, DocumentItem,
  Review, ReviewCreate,
  DailyMenu, MenuWeekResponse,
  SearchResponse,
} from '@/types';

// ============================================================================
// Main
// ============================================================================
export const pagesApi = {
  list: () => api.get<PaginatedResponse<PageListItem>>('/pages/').then(r => r.data),
  detail: (slug: string) => api.get<Page>(`/pages/${slug}/`).then(r => r.data),
};

export const slidersApi = {
  list: () => api.get<Slider[]>('/sliders/').then(r => r.data),
};

export const contactApi = {
  list: () => api.get<Contact[]>('/contacts/').then(r => r.data),
};

export const staffApi = {
  list: () => api.get<StaffMember[]>('/staff/').then(r => r.data),
};

export const parentsApi = {
  announcements: () => api.get<ParentsAnnouncement[]>('/parents/announcements/').then(r => r.data),
  documents: () => api.get<ParentsDocument[]>('/parents/documents/').then(r => r.data),
  adaptation: () => api.get<ParentsAdaptationPhoto[]>('/parents/adaptation/').then(r => r.data),
  enrollment: () => api.get<ParentsEnrollmentDoc[]>('/parents/enrollment/').then(r => r.data),
  samples: () => api.get<ParentsApplicationSample[]>('/parents/samples/').then(r => r.data),
};

export const attestationApi = {
  settings: () => api.get<AttestationSettings>('/attestation/settings/').then(r => r.data),
  documents: () => api.get<AttestationDocument[]>('/attestation/documents/').then(r => r.data),
  steps: () => api.get<AttestationStep[]>('/attestation/steps/').then(r => r.data),
  categories: () => api.get<AttestationCategory[]>('/attestation/categories/').then(r => r.data),
  laws: () => api.get<AttestationLaw[]>('/attestation/laws/').then(r => r.data),
};

// ============================================================================
// News
// ============================================================================
export const newsApi = {
  list: (params?: { page?: number; category__slug?: string; search?: string }) =>
    api.get<PaginatedResponse<NewsListItem>>('/news/', { params }).then(r => r.data),
  // count=true → бек збільшить лічильник переглядів (фронт просить про це лише раз на людину)
  detail: (slug: string, count = false) =>
    api.get<NewsDetail>(`/news/${slug}/`, { params: count ? { count: 1 } : undefined }).then(r => r.data),
  categories: () => api.get<NewsCategory[]>('/news-categories/').then(r => r.data),
};

// ============================================================================
// Gallery
// ============================================================================
export const galleryApi = {
  categories: () => api.get<GalleryCategory[]>('/gallery/categories/').then(r => r.data),
  albums: (params?: { page?: number; category__slug?: string }) =>
    api.get<PaginatedResponse<GalleryAlbumListItem>>('/gallery/albums/', { params }).then(r => r.data),
  album: (slug: string) => api.get<GalleryAlbumDetail>(`/gallery/albums/${slug}/`).then(r => r.data),
};

// ============================================================================
// Groups
// ============================================================================
export const groupsApi = {
  list: () => api.get<GroupListItem[]>('/groups/').then(r => r.data),
  detail: (slug: string) => api.get<GroupDetail>(`/groups/${slug}/`).then(r => r.data),
};

// ============================================================================
// Specialists
// ============================================================================
export const specialistsApi = {
  list: () => api.get<SpecialistPage[]>('/specialists/').then(r => r.data),
  detail: (pageType: SpecialistPageType) =>
    api.get<SpecialistPage>(`/specialists/${pageType}/`).then(r => r.data),
};

// ============================================================================
// Circles
// ============================================================================
export const circlesApi = {
  list: () => api.get<CircleListItem[]>('/circles/').then(r => r.data),
  detail: (slug: string) => api.get<CircleDetail>(`/circles/${slug}/`).then(r => r.data),
};

// ============================================================================
// Documents
// ============================================================================
export const documentsApi = {
  list: (params?: { page?: number; category__slug?: string }) =>
    api.get<PaginatedResponse<DocumentItem>>('/documents/', { params }).then(r => r.data),
  categories: () => api.get<DocumentCategory[]>('/document-categories/').then(r => r.data),
  trackDownload: (id: number) => api.post(`/documents/${id}/track_download/`),
};

// ============================================================================
// Reviews
// ============================================================================
export const reviewsApi = {
  list: (params?: { page?: number; rating?: number; ordering?: string }) =>
    api.get<PaginatedResponse<Review>>('/reviews/', { params }).then(r => r.data),
  create: (data: ReviewCreate) => api.post('/reviews/', data),
  like: (id: number) => api.post(`/reviews/${id}/like/`),
  dislike: (id: number) => api.post(`/reviews/${id}/dislike/`),
};

// ============================================================================
// Menu
// ============================================================================
export const menuApi = {
  today: () => api.get<{ menu: DailyMenu | null }>('/menu/today/').then(r => r.data),
  week: (start?: string) =>
    api.get<MenuWeekResponse>('/menu/week/', { params: start ? { start } : undefined }).then(r => r.data),
  byDate: (date: string) => api.get<DailyMenu>(`/menu/${date}/`).then(r => r.data),
};

// ============================================================================
// Search
// ============================================================================
export const searchApi = {
  query: (q: string) => api.get<SearchResponse>('/search/', { params: { q } }).then(r => r.data),
};
