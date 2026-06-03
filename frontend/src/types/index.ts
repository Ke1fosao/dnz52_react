// Загальні типи відповідей API

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ============================================================================
// Main app
// ============================================================================

export interface PageImage {
  id: number;
  image: string;
  caption: string;
  order: number;
  is_active: boolean;
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  image: string | null;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  order: number;
  images: PageImage[];
}

export interface PageListItem {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  order: number;
}

export interface Slider {
  id: number;
  title: string;
  description: string;
  image: string;
  video?: string | null;
  link: string;
  order: number;
  is_active: boolean;
}

export interface Contact {
  id: number;
  address: string;
  phone: string;
  email: string;
  working_hours: string;
  map_embed: string;
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
}

export interface ParentsAnnouncement {
  id: number;
  title: string;
  image: string;
  link: string;
  order: number;
  is_active: boolean;
}

export interface ParentsDocument {
  id: number;
  title: string;
  description: string;
  link_type: 'external' | 'page' | 'file';
  external_url: string;
  internal_slug: string;
  file: string | null;
  icon: string;
  accent: string;
  order: number;
  is_active: boolean;
  url: string;
}

export interface ParentsAdaptationPhoto {
  id: number;
  title: string;
  image: string;
  order: number;
  is_active: boolean;
}

export interface ParentsEnrollmentDoc {
  id: number;
  title: string;
  note: string;
  order: number;
  is_active: boolean;
}

export interface ParentsApplicationSample {
  id: number;
  title: string;
  image: string;
  caption: string;
  order: number;
  is_active: boolean;
}

export interface StaffMember {
  id: number;
  full_name: string;
  position: string;
  photo: string | null;
  education: string;
  experience: string;
  category: string;
  awards: string;
  awards_list: string[];
  bio: string;
  email: string;
  phone: string;
  reception_hours: string;
  is_featured: boolean;
  accent_color: string;
  detail_url: string;
  order: number;
  is_active: boolean;
}

export interface AttestationDocument {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  url: string;
  icon: string;
  accent: string;
  order: number;
  is_active: boolean;
}

export interface AttestationStep {
  id: number;
  title: string;
  description: string;
  order: number;
  is_active: boolean;
}

export interface AttestationCategory {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  is_active: boolean;
}

export interface AttestationLaw {
  id: number;
  title: string;
  url: string;
  order: number;
  is_active: boolean;
}

export interface AttestationSettings {
  id: number;
  hero_lead: string;
  intro_html: string;
  docs_section_subtitle: string;
  contact_title: string;
  contact_html: string;
}

// ============================================================================
// News
// ============================================================================

export interface NewsCategory {
  id: number;
  name: string;
  slug: string;
}

export interface NewsListItem {
  id: number;
  title: string;
  slug: string;
  category: NewsCategory | null;
  image: string | null;
  created_at: string;
  updated_at: string;
  views: number;
  excerpt: string;
}

export interface NewsRelated {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  created_at: string;
}

export interface NewsDetail {
  id: number;
  title: string;
  slug: string;
  category: NewsCategory | null;
  content: string;
  image: string | null;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  views: number;
  related: NewsRelated[];
}

// ============================================================================
// Gallery
// ============================================================================

export interface GalleryCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  order: number;
  albums_count: number;
}

export interface GalleryPhoto {
  id: number;
  image: string;
  title: string;
  description: string;
  order: number;
}

export interface GalleryAlbumListItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  cover: string;
  category: GalleryCategory | null;
  created_at: string;
  is_published: boolean;
  photos_count: number;
}

export interface GalleryAlbumDetail extends GalleryAlbumListItem {
  photos: GalleryPhoto[];
}

// ============================================================================
// Groups
// ============================================================================

export type AgeGroup = 'nursery' | 'junior' | 'middle' | 'senior' | 'school';

export interface GroupStaff {
  id: number;
  role: 'teacher' | 'assistant';
  role_display: string;
  full_name: string;
  photo: string | null;
  birth_date: string | null;
  education: string;
  experience: string;
  motto: string;
  order: number;
}

export interface GroupListItem {
  id: number;
  name: string;
  slug: string;
  age_group: AgeGroup | '';
  age_group_display: string;
  motto: string;
  cover: string | null;
  color: string;
  order: number;
}

export interface GroupDetail extends GroupListItem {
  description: string;
  album_slug: string | null;
  is_published: boolean;
  staff: GroupStaff[];
}

// ============================================================================
// Specialists
// ============================================================================

export type SpecialistPageType =
  | 'methodical' | 'physical' | 'music' | 'psychologist' | 'medical';

export interface Specialist {
  id: number;
  full_name: string;
  position: string;
  photo: string | null;
  birth_date: string | null;
  education: string;
  experience: string;
  category: string;
  motto: string;
  bio: string;
  order: number;
}

export interface SpecialistPagePhoto {
  id: number;
  image: string;
  caption: string;
  order: number;
  is_active: boolean;
}

export interface SpecialistPageSection {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accent: string;
  kind: 'info' | 'event';
  link_label: string;
  link_url: string;
  has_link: boolean;
  order: number;
  is_active: boolean;
  photos: SpecialistPagePhoto[];
}

export interface SpecialistPage {
  id: number;
  page_type: SpecialistPageType;
  page_type_display: string;
  title: string;
  intro: string;
  description: string;
  theme_title: string;
  theme_period: string;
  theme_text: string;
  specialists: Specialist[];
  sections: SpecialistPageSection[];
}

// ============================================================================
// Circles
// ============================================================================

export interface CircleBenefit {
  id: number;
  icon: string;
  title: string;
  text: string;
  order: number;
}

export interface CircleSession {
  id: number;
  day: string;
  time: string;
  note: string;
  order: number;
}

export interface CircleListItem {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  leader: string;
  age_group: string;
  schedule: string;
  duration: string;
  format: string;
  price: string;
  icon: string;
  color: string;
  cover: string | null;
  album_slug: string | null;
  is_featured: boolean;
  order: number;
}

export interface CircleDetail extends CircleListItem {
  goal: string;
  description: string;
  benefits: CircleBenefit[];
  sessions: CircleSession[];
  is_published: boolean;
}

// ============================================================================
// Documents
// ============================================================================

export interface DocumentCategory {
  id: number;
  name: string;
  slug: string;
  order: number;
  documents_count: number;
}

export interface DocumentItem {
  id: number;
  title: string;
  category: DocumentCategory | null;
  file: string;
  file_size: string | null;
  description: string;
  created_at: string;
  is_published: boolean;
  downloads: number;
}

// ============================================================================
// Reviews
// ============================================================================

export interface Review {
  id: number;
  author: string;
  child_group: string;
  rating: number;
  text: string;
  created_at: string;
  likes: number;
  dislikes: number;
  admin_reply: string;
}

// ============================================================================
// FAQ
// ============================================================================
export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  likes: number;
  order: number;
}

export interface FAQGroup {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  items: FAQItem[];
}

export interface FAQAsk {
  name: string;
  phone: string;
  question: string;
  website?: string;
}

// ============================================================================
// Events (календар)
// ============================================================================
export interface EventItem {
  id: number;
  title: string;
  slug: string;
  event_type: string;
  event_type_display: string;
  description: string;
  start_date: string;
  end_date: string | null;
  location: string;
  image: string | null;
  color: string;
  is_multiday: boolean;
}

export interface ReviewCreate {
  author: string;
  child_group?: string;
  rating: number;
  text: string;
  website?: string; // honeypot
}

// ============================================================================
// Menu
// ============================================================================

export interface DailyMenu {
  id: number;
  date: string;
  breakfast: string;
  second_breakfast: string;
  lunch: string;
  snack: string;
  dinner: string;
  note: string;
  is_published: boolean;
  has_any_meal: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuWeekResponse {
  start: string;
  end: string;
  menus: DailyMenu[];
}

// ============================================================================
// Search
// ============================================================================

export type SearchResultType =
  | 'news' | 'page' | 'group' | 'circle' | 'specialist' | 'document';

export interface SearchResult {
  type: SearchResultType;
  title: string;
  slug: string;
  excerpt: string;
}

export interface SearchResponse {
  query: string;
  count?: number;
  results: SearchResult[];
}
