import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Send } from 'lucide-react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useReviews, useCreateReview, useLikeReview, useDislikeReview } from '@/hooks/useApi';
import { useVotedReviews } from '@/hooks/useVotedReviews';
import { celebrate } from '@/lib/confetti';
import { formatDate, cn } from '@/lib/utils';

const reviewSchema = z.object({
  author: z.string().min(2, 'Введіть ваше ім\'я (мінімум 2 символи)'),
  child_group: z.string().optional(),
  rating: z.number().min(1).max(5),
  text: z.string().min(5, 'Відгук занадто короткий (мін. 5 символів)'),
  website: z.string().optional(),
});

type FormData = z.infer<typeof reviewSchema>;
const PAGE_SIZE = 12;

export function ReviewsPage() {
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>();
  const [ordering, setOrdering] = useState('-created_at');

  const { data, isLoading } = useReviews({ page, rating: ratingFilter, ordering });
  const createReview = useCreateReview();
  const likeReview = useLikeReview();
  const dislikeReview = useDislikeReview();
  const { getVote, setVote, hasVoted } = useVotedReviews();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(reviewSchema), defaultValues: { rating: 5 },
  });
  const rating = watch('rating');

  const onSubmit = async (formData: FormData) => {
    try {
      await createReview.mutateAsync(formData);
      reset({ rating: 5 });
      celebrate();
      toast.success('Дякуємо! Ваш відгук відправлено на модерацію.', {
        description: 'Він з\'явиться на сайті після перевірки адміністратором.', duration: 6000,
      });
    } catch (err) {
      const ax = err as AxiosError<{ detail?: string; [key: string]: unknown }>;
      const d = ax.response?.data;
      let message = 'Не вдалось надіслати відгук. Спробуйте пізніше.';
      if (d?.detail) message = String(d.detail);
      else if (d && typeof d === 'object') {
        const errs = Object.entries(d).map(([f, e]) => Array.isArray(e) ? `${f}: ${e.join(', ')}` : `${f}: ${e}`).join('; ');
        if (errs) message = errs;
      }
      toast.error('Помилка', { description: message, duration: 8000 });
    }
  };

  const handleVote = (id: number, type: 'like' | 'dislike') => {
    if (hasVoted(id)) return;
    setVote(id, type);
    if (type === 'like') likeReview.mutate(id); else dislikeReview.mutate(id);
  };

  return (
    <div className="container mx-auto px-4 max-w-7xl">
      <Seo title="Відгуки" description="Відгуки батьків про заклад дошкільної освіти №52" />
      <PageHero title="Відгуки батьків" subtitle="Ваша думка дуже важлива для нас!" icon="💬" variant="warm" />

      <div className="grid lg:grid-cols-3 gap-8 pb-12">
        {/* Список */}
        <div className="lg:col-span-2 space-y-5">
          {/* Фільтри */}
          <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 rounded-[1.5rem] p-3 shadow-sm border border-gray-100 dark:border-slate-800">
            <Pill active={!ratingFilter} onClick={() => { setRatingFilter(undefined); setPage(1); }}>Усі</Pill>
            {[5, 4, 3, 2, 1].map(r => (
              <button key={r} onClick={() => { setRatingFilter(r); setPage(1); }}
                className={cn('px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors',
                  ratingFilter === r ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300')}>
                {r} <Star size={12} className="fill-current" />
              </button>
            ))}
            <select value={ordering} onChange={e => { setOrdering(e.target.value); setPage(1); }}
              className="ml-auto px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-0 outline-none cursor-pointer">
              <option value="-created_at">Найновіші</option>
              <option value="created_at">Найстаріші</option>
              <option value="-rating">Найкращі</option>
              <option value="-likes">Популярні</option>
            </select>
          </div>

          {data && data.count > 0 && (
            <p className="text-xs text-gray-400 dark:text-slate-500 font-medium px-1">
              Всього відгуків: <strong className="text-gray-700 dark:text-slate-300">{data.count}</strong>
              {data.count > PAGE_SIZE && <> · сторінка {page} з {Math.ceil(data.count / PAGE_SIZE)}</>}
            </p>
          )}

          {isLoading ? (
            <Spinner />
          ) : !data || data.results.length === 0 ? (
            <EmptyState icon={<MessageSquare className="h-16 w-16" />} title="Поки немає відгуків"
              description="Будьте першим, хто залишить відгук про наш садочок!" />
          ) : (
            <>
              <div className="space-y-4">
                {data.results.map(review => {
                  const currentVote = getVote(review.id);
                  const voted = hasVoted(review.id);
                  return (
                    <div key={review.id} className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 text-white flex items-center justify-center font-black text-lg shrink-0">
                            {review.author.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-black text-gray-900 dark:text-white">{review.author}</h4>
                            {review.child_group && <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">{review.child_group}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={16} className={cn(i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-slate-700')} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-line mb-4 leading-relaxed">{review.text}</p>
                      {review.admin_reply && (
                        <div className="mb-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 p-4">
                          <div className="flex items-center gap-1.5 mb-1 text-[11px] font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">
                            <MessageSquare size={13} /> Відповідь адміністрації
                          </div>
                          <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">{review.admin_reply}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">{formatDate(review.created_at)}</span>
                        <div className="flex items-center gap-1">
                          <VoteBtn type="up" count={review.likes} active={currentVote === 'like'} voted={voted} onClick={() => handleVote(review.id, 'like')} />
                          <VoteBtn type="down" count={review.dislikes} active={currentVote === 'dislike'} voted={voted} onClick={() => handleVote(review.id, 'dislike')} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pagination page={page} pageSize={PAGE_SIZE} total={data.count} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </>
          )}
        </div>

        {/* Форма */}
        <aside className="lg:sticky lg:top-28 self-start">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-7 shadow-lg border border-gray-100 dark:border-slate-800">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Залишити відгук ✨</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-5 font-medium">Поділіться враженнями. Відгук зʼявиться після модерації.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input type="text" {...register('website')} className="hidden" tabIndex={-1} autoComplete="off" />
              <div>
                <Label htmlFor="author">Ваше імʼя *</Label>
                <Input id="author" placeholder="Олена Петрівна" {...register('author')} />
                {errors.author && <p className="text-xs text-red-500 mt-1 font-medium">{errors.author.message}</p>}
              </div>
              <div>
                <Label htmlFor="child_group">Група дитини</Label>
                <Input id="child_group" placeholder="напр. Сонечко" {...register('child_group')} />
              </div>
              <div>
                <Label>Оцінка *</Label>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setValue('rating', n)} className="p-1" aria-label={`Оцінка ${n}`}>
                      <Star size={28} className={cn('transition-colors', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-slate-600')} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="text">Ваш відгук *</Label>
                <Textarea id="text" placeholder="Поділіться вашими враженнями про садочок..." rows={5} {...register('text')} />
                {errors.text && <p className="text-xs text-red-500 mt-1 font-medium">{errors.text.message}</p>}
              </div>
              <button type="submit" disabled={createReview.isPending}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold py-3.5 rounded-full shadow-lg hover:-translate-y-0.5 transition-transform disabled:opacity-60">
                {createReview.isPending ? 'Надсилаємо...' : <>Надіслати відгук <Send size={16} /></>}
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn('px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors',
      active ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300')}>
      {children}
    </button>
  );
}

function VoteBtn({ type, count, active, voted, onClick }: { type: 'up' | 'down'; count: number; active: boolean; voted: boolean; onClick: () => void }) {
  const Icon = type === 'up' ? ThumbsUp : ThumbsDown;
  const activeColor = type === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  const hoverColor = type === 'up' ? 'hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20' : 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20';
  return (
    <button onClick={onClick} disabled={voted}
      className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-colors',
        active ? `${activeColor} cursor-default` : voted ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed' : `text-gray-500 dark:text-slate-400 ${hoverColor} cursor-pointer`)}>
      <Icon size={14} className={cn(active && 'fill-current')} /> {count}
    </button>
  );
}
