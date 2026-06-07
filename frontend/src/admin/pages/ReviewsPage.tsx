import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Reply, Trash2, Clock, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { adminReviewsApi, adminAiApi } from '../lib/adminApi';
import { Stars, FilterTabs, ActButton, ListSkeleton, EmptyBox } from '../components/AdminUI';
import { Toggle } from '../components/FormControls';
import { formatDate, cn } from '@/lib/utils';
import type { AdminReview } from '../types';

function AiModerationToggle() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-ai-settings'], queryFn: adminAiApi.settings });
  const save = useMutation({
    mutationFn: (v: boolean) => adminAiApi.updateSettings({ auto_moderate_reviews: v }),
    onSuccess: (d) => { qc.setQueryData(['admin-ai-settings'], d); toast.success(d.auto_moderate_reviews ? 'Авто-модерацію увімкнено' : 'Авто-модерацію вимкнено'); },
    onError: () => toast.error('Помилка'),
  });
  return (
    <div className="premium-glass rounded-2xl p-4 flex items-start gap-3">
      <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white grid place-items-center shrink-0"><Bot size={20} /></span>
      <div className="flex-1 min-w-0">
        <Toggle checked={!!data?.auto_moderate_reviews} onChange={v => save.mutate(v)} label="Авто-модерація відгуків ШІ" />
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
          {data?.ai_configured === false
            ? '⚠️ ШІ не налаштовано (немає ключа в .env) — функція не працюватиме.'
            : 'Коректні відгуки публікуються автоматично; підозрілі (лайка, погрози) — відкладаються сюди на ручну перевірку.'}
        </p>
      </div>
    </div>
  );
}

type Filter = 'pending' | 'approved' | 'all';

export function ReviewsPage() {
  const [filter, setFilter] = useState<Filter>('pending');
  const qc = useQueryClient();
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-reviews', filter],
    queryFn: () => adminReviewsApi.list(filter),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-reviews'] });
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const approve = useMutation({ mutationFn: adminReviewsApi.approve, onSuccess: () => { toast.success('Опубліковано'); invalidate(); }, onError: () => toast.error('Помилка') });
  const unpublish = useMutation({ mutationFn: adminReviewsApi.unpublish, onSuccess: () => { toast.success('Знято з публікації'); invalidate(); }, onError: () => toast.error('Помилка') });
  const remove = useMutation({ mutationFn: adminReviewsApi.remove, onSuccess: () => { toast.success('Видалено'); invalidate(); }, onError: () => toast.error('Помилка') });
  const reply = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) => adminReviewsApi.reply(id, text),
    onSuccess: () => { toast.success('Відповідь збережено'); invalidate(); }, onError: () => toast.error('Помилка'),
  });

  return (
    <div className="space-y-5 animate-page-fade-in">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Відгуки</h1>
        <p className="text-gray-500 dark:text-slate-400 font-medium">Модерація відгуків відвідувачів</p>
      </div>

      <AiModerationToggle />

      <FilterTabs value={filter} onChange={setFilter} tabs={[
        { value: 'pending', label: 'На модерації', count: reviews && filter === 'pending' ? reviews.length : undefined },
        { value: 'approved', label: 'Опубліковані' },
        { value: 'all', label: 'Усі' },
      ]} />

      {isLoading ? <ListSkeleton /> : !reviews?.length ? (
        <EmptyBox text="Немає відгуків у цьому фільтрі" />
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <ReviewCard
              key={r.id}
              review={r}
              onApprove={() => approve.mutate(r.id)}
              onUnpublish={() => unpublish.mutate(r.id)}
              onRemove={() => { if (window.confirm('Видалити відгук назавжди?')) remove.mutate(r.id); }}
              onReply={text => reply.mutate({ id: r.id, text })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review, onApprove, onUnpublish, onRemove, onReply }: {
  review: AdminReview;
  onApprove: () => void;
  onUnpublish: () => void;
  onRemove: () => void;
  onReply: (text: string) => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [text, setText] = useState(review.admin_reply || '');

  return (
    <div className="premium-glass rounded-[1.5rem] p-5">
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-black text-gray-900 dark:text-white">{review.author}</span>
            {review.child_group && <span className="text-xs text-gray-400 dark:text-slate-500">· {review.child_group}</span>}
          </div>
          <Stars rating={review.rating} />
        </div>
        <span className={cn('text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap',
          review.is_approved
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300')}>
          {review.is_approved ? '● Опубліковано' : '● На модерації'}
        </span>
      </div>

      <p className="text-gray-600 dark:text-slate-300 mb-2 whitespace-pre-wrap">{review.text}</p>
      <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1.5 mb-2">
        <Clock size={12} /> {formatDate(review.created_at)} · 👍 {review.likes} · 👎 {review.dislikes}
      </p>
      {review.ai_moderation && (
        <p className="text-xs text-violet-600 dark:text-violet-300 inline-flex items-start gap-1.5 mb-3 bg-violet-50/60 dark:bg-violet-900/15 px-2.5 py-1 rounded-lg">
          <Bot size={13} className="shrink-0 mt-0.5" /> <span>ШІ: {review.ai_moderation}</span>
        </p>
      )}

      {review.admin_reply && !replyOpen && (
        <div className="bg-blue-50/60 dark:bg-blue-900/15 border-l-4 border-blue-500 rounded-r-xl p-3 mb-3 text-sm">
          <span className="font-bold text-blue-700 dark:text-blue-300">Відповідь закладу: </span>
          <span className="text-gray-600 dark:text-slate-300">{review.admin_reply}</span>
        </div>
      )}

      {replyOpen && (
        <div className="mb-3">
          <textarea
            value={text} onChange={e => setText(e.target.value)} rows={3}
            placeholder="Офіційна відповідь закладу (показується під відгуком на сайті)…"
            className="w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-900 dark:text-white"
          />
          <div className="flex gap-2 mt-2">
            <ActButton color="blue" onClick={() => { onReply(text); setReplyOpen(false); }}>Зберегти відповідь</ActButton>
            <ActButton color="slate" onClick={() => { setReplyOpen(false); setText(review.admin_reply || ''); }}>Скасувати</ActButton>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {review.is_approved
          ? <ActButton color="amber" icon={X} onClick={onUnpublish}>Зняти з публікації</ActButton>
          : <ActButton color="emerald" icon={Check} onClick={onApprove}>Опублікувати</ActButton>}
        <ActButton color="blue" icon={Reply} onClick={() => setReplyOpen(o => !o)}>
          {review.admin_reply ? 'Змінити відповідь' : 'Відповісти'}
        </ActButton>
        <ActButton color="rose" icon={Trash2} onClick={onRemove}>Видалити</ActButton>
      </div>
    </div>
  );
}
