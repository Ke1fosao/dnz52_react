// Типи даних адмінпанелі (/manage)

export interface AdminUser {
  username: string;
  full_name: string;
  is_superuser: boolean;
  has_2fa?: boolean;
}

export interface AdminProfile {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_superuser: boolean;
  has_2fa: boolean;
}

export interface ChartPoint { label: string; value: number }

export interface AdminHistoryItem {
  model: string;
  repr: string;
  type: '+' | '~' | '-';
  type_display: string;
  user: string;
  date: string;
}

export interface AdminStats {
  pending_reviews: number;
  new_questions: number;
  subscriptions?: number;
  totals: Record<string, number>;
  chart: ChartPoint[];
  reviews_chart?: ChartPoint[];
  recent?: AdminHistoryItem[];
}

export interface AdminAccount {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  last_login: string | null;
  date_joined: string;
}

export interface AdminPushSub {
  id: number;
  user_agent: string;
  topics: string[];
  is_active: boolean;
  created_at: string;
  host: string;
}

export interface AdminPushStats {
  total: number;
  active: number;
  items: AdminPushSub[];
}

export interface AdminReview {
  id: number;
  author: string;
  child_group: string;
  rating: number;
  text: string;
  created_at: string;
  is_approved: boolean;
  likes: number;
  dislikes: number;
  admin_reply: string;
  ai_moderation: string;
}

export interface AdminAISettings {
  auto_moderate_reviews: boolean;
  ai_configured: boolean;
}

export type QuestionStatus = 'new' | 'in_progress' | 'callback' | 'done';

export interface AdminQuestion {
  id: number;
  name: string;
  phone: string;
  question: string;
  created_at: string;
  status: QuestionStatus;
  status_display: string;
  callback_date: string | null;
  handled_at: string | null;
  handled_by_name: string | null;
  admin_note: string;
}

// --- Контент ---
export interface IdName { id: number; name: string }
export interface ValueLabel { value: string; label: string }

export interface AdminMeta {
  news_categories: IdName[];
  news_tags: IdName[];
  faq_categories: IdName[];
  document_categories: IdName[];
  event_types: ValueLabel[];
  groups: IdName[];
  news_statuses: ValueLabel[];
  gallery_albums: IdName[];
  gallery_categories: IdName[];
  age_groups: ValueLabel[];
}

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  order?: number;
}

export interface AdminDocument {
  id: number;
  title: string;
  category: number | null;
  category_name: string | null;
  file: string;
  file_size: string;
  description: string;
  is_published: boolean;
  downloads: number;
  created_at: string;
}

export interface AdminContact {
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

export interface AdminSlider {
  id: number;
  title: string;
  description: string;
  image: string | null;
  video: string | null;
  link: string;
  order: number;
  is_active: boolean;
}

export interface AdminStaffMember {
  id: number;
  full_name: string;
  position: string;
  photo: string | null;
  education: string;
  experience: string;
  category: string;
  awards: string;
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

export interface AdminPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  image: string | null;
  is_published: boolean;
  order: number;
  updated_at: string;
}

export interface AdminPageImage {
  id: number;
  page: number;
  image: string;
  caption: string;
  order: number;
  is_active: boolean;
}

export interface AdminGroup {
  id: number;
  name: string;
  slug: string;
  age_group: string;
  age_group_display: string;
  motto: string;
  description: string;
  cover: string | null;
  color: string;
  album: number | null;
  order: number;
  is_published: boolean;
}

export interface AdminGroupStaff {
  id: number;
  group: number;
  role: string;
  full_name: string;
  photo: string | null;
  birth_date: string | null;
  education: string;
  experience: string;
  motto: string;
  order: number;
}

export interface AdminCircle {
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
  goal: string;
  description: string;
  album: number | null;
  is_featured: boolean;
  order: number;
  is_published: boolean;
}

export interface AdminCircleBenefit { id: number; circle: number; icon: string; title: string; text: string; order: number; }
export interface AdminCircleSession { id: number; circle: number; day: string; time: string; note: string; order: number; }

export interface AdminNews {
  id: number;
  title: string;
  slug: string;
  category: number | null;
  category_name: string | null;
  tags: number[];
  content: string;
  image: string | null;
  status: string;
  status_display: string;
  publish_at: string | null;
  is_published: boolean;
  views: number;
  created_at: string;
}

export interface AdminEvent {
  id: number;
  title: string;
  slug: string;
  event_type: string;
  event_type_display: string;
  start_date: string;
  end_date: string | null;
  location: string;
  description: string;
  image: string | null;
  group: number | null;
  is_published: boolean;
  created_at: string;
}

export interface AdminFAQItem {
  id: number;
  question: string;
  answer: string;
  category: number | null;
  category_name: string | null;
  order: number;
  is_published: boolean;
  likes: number;
}

export interface AdminDailyMenu {
  id: number;
  date: string;
  weekday_display: string;
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

export interface AdminMenuTemplate {
  weekday: number;
  weekday_display: string;
  breakfast: string;
  second_breakfast: string;
  lunch: string;
  snack: string;
  dinner: string;
  note: string;
  is_active: boolean;
}

export interface AdminGalleryAlbum {
  id: number;
  title: string;
  slug: string;
  description: string;
  cover: string | null;
  category: number | null;
  category_name: string | null;
  photos_count: number;
  created_at: string;
  is_published: boolean;
}

export interface AdminGalleryPhoto {
  id: number;
  album: number;
  image: string;
  title: string;
  description: string;
  order: number;
}

// Узагальнений рядок для FlatCrudManager (батьки, списки атестації, альбоми спеціалістів)
export interface AdminFlatRow {
  id: number;
  order?: number;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface AdminAttestationSettings {
  id: number;
  hero_lead: string;
  intro_html: string;
  docs_section_subtitle: string;
  contact_title: string;
  contact_html: string;
}

export interface AdminSpecialistPage {
  id: number;
  page_type: string;
  page_type_display: string;
  title: string;
  intro: string;
  description: string;
  theme_title: string;
  theme_period: string;
  theme_text: string;
  specialists_count: number;
  sections_count: number;
}

export interface AdminSpecialist {
  id: number;
  page: number;
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

export interface AdminSpecialistSection {
  id: number;
  page: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accent: string;
  kind: string;
  kind_display: string;
  link_album: number | null;
  link_news_slug: string;
  link_external_url: string;
  link_label: string;
  order: number;
  is_active: boolean;
  photos_count: number;
}

export interface AdminSpecialistSectionPhoto {
  id: number;
  section: number;
  image: string;
  caption: string;
  order: number;
  is_active: boolean;
}
