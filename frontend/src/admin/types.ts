// Типи даних адмінпанелі (/manage)

export interface AdminUser {
  username: string;
  full_name: string;
  is_superuser: boolean;
}

export interface AdminStats {
  pending_reviews: number;
  new_questions: number;
  totals: Record<string, number>;
  chart: { label: string; value: number }[];
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
