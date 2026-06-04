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
