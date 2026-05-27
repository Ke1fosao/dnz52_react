import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AxiosError } from 'axios';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useReviews, useCreateReview, useLikeReview, useDislikeReview } from '@/hooks/useApi';
import { useVotedReviews } from '@/hooks/useVotedReviews';
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
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data, isLoading } = useReviews({ page, rating: ratingFilter, ordering });
  const createReview = useCreateReview();
  const likeReview = useLikeReview();
  const dislikeReview = useDislikeReview();
  const { getVote, setVote, hasVoted } = useVotedReviews();

  const {
    register, handleSubmit, watch, setValue, reset, formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5 },
  });
  const rating = watch('rating');

  const onSubmit = async (formData: FormData) => {
    setSubmitError(null);
    try {
      await createReview.mutateAsync(formData);
      setSubmitted(true);
      reset({ rating: 5 });
      setTimeout(() => setSubmitted(false), 8000);
    } catch (err) {
      // Показуємо реальну помилку користувачу
      const ax = err as AxiosError<{ detail?: string; [key: string]: unknown }>;
      const data = ax.response?.data;
      let message = 'Не вдалось надіслати відгук. Спробуйте пізніше.';

      if (data?.detail) {
        message = String(data.detail);
      } else if (data && typeof data === 'object') {
        // DRF повертає помилки валідації у форматі { field: [message] }
        const errors = Object.entries(data)
          .map(([field, errs]) => Array.isArray(errs) ? `${field}: ${errs.join(', ')}` : `${field}: ${errs}`)
          .join('; ');
        if (errors) message = errors;
      }

      setSubmitError(message);
      setTimeout(() => setSubmitError(null), 10000);
    }
  };

  const handleVote = (reviewId: number, type: 'like' | 'dislike') => {
    if (hasVoted(reviewId)) return;
    setVote(reviewId, type);
    if (type === 'like') likeReview.mutate(reviewId);
    else dislikeReview.mutate(reviewId);
  };

  return (
    <>
      <Seo title="Відгуки" description="Відгуки батьків про заклад дошкільної освіти №52" />
      <PageHero
        title="Відгуки батьків"
        subtitle="Ваша думка дуже важлива для нас!"
        icon="💬"
        variant="warm"
      />

      <div className="container py-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold mr-2">Фільтр:</span>
            <button
              onClick={() => { setRatingFilter(undefined); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold',
                !ratingFilter ? 'bg-primary text-white' : 'bg-muted'
              )}
            >
              Усі
            </button>
            {[5, 4, 3, 2, 1].map(r => (
              <button
                key={r}
                onClick={() => { setRatingFilter(r); setPage(1); }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1',
                  ratingFilter === r ? 'bg-amber-500 text-white' : 'bg-muted'
                )}
              >
                {r} <Star className="h-3 w-3 fill-current" />
              </button>
            ))}
            <select
              value={ordering}
              onChange={e => { setOrdering(e.target.value); setPage(1); }}
              className="ml-auto px-3 py-1.5 rounded-full text-xs font-semibold bg-muted border-0"
            >
              <option value="-created_at">Найновіші</option>
              <option value="created_at">Найстаріші</option>
              <option value="-rating">Найкращі</option>
              <option value="-likes">Популярні</option>
            </select>
          </div>

          {data && data.count > 0 && (
            <p className="text-xs text-muted-foreground">
              Всього відгуків: <strong>{data.count}</strong>
              {data.count > PAGE_SIZE && (
                <> · сторінка {page} з {Math.ceil(data.count / PAGE_SIZE)}</>
              )}
            </p>
          )}

          {isLoading ? (
            <Spinner />
          ) : !data || data.results.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="h-16 w-16" />}
              title="Поки немає відгуків"
              description="Будьте першим, хто залишить відгук про наш садочок!"
            />
          ) : (
            <>
            <div className="space-y-4">
              {data.results.map(review => {
                const currentVote = getVote(review.id);
                const voted = hasVoted(review.id);

                return (
                  <Card key={review.id} className="hover:shadow-card-hover transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h4 className="font-display font-bold">{review.author}</h4>
                          {review.child_group && (
                            <p className="text-xs text-muted-foreground">{review.child_group}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-4 w-4',
                                i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-line mb-3">{review.text}</p>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground">{formatDate(review.created_at)}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleVote(review.id, 'like')}
                            disabled={voted}
                            title={voted
                              ? (currentVote === 'like' ? 'Ви вже поставили лайк' : 'Ви вже проголосували')
                              : 'Поставити лайк'}
                            className={cn(
                              'flex items-center gap-1 px-2.5 py-1.5 rounded-full font-semibold transition-colors',
                              currentVote === 'like'
                                ? 'bg-green-100 text-green-700 cursor-default'
                                : voted
                                  ? 'text-muted-foreground/50 cursor-not-allowed'
                                  : 'hover:bg-green-50 hover:text-green-600 cursor-pointer'
                            )}
                          >
                            <ThumbsUp
                              className={cn('h-3.5 w-3.5', currentVote === 'like' && 'fill-current')}
                            />
                            {review.likes}
                          </button>
                          <button
                            onClick={() => handleVote(review.id, 'dislike')}
                            disabled={voted}
                            title={voted
                              ? (currentVote === 'dislike' ? 'Ви вже поставили дизлайк' : 'Ви вже проголосували')
                              : 'Поставити дизлайк'}
                            className={cn(
                              'flex items-center gap-1 px-2.5 py-1.5 rounded-full font-semibold transition-colors',
                              currentVote === 'dislike'
                                ? 'bg-red-100 text-red-700 cursor-default'
                                : voted
                                  ? 'text-muted-foreground/50 cursor-not-allowed'
                                  : 'hover:bg-red-50 hover:text-red-600 cursor-pointer'
                            )}
                          >
                            <ThumbsDown
                              className={cn('h-3.5 w-3.5', currentVote === 'dislike' && 'fill-current')}
                            />
                            {review.dislikes}
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={data.count}
              onChange={p => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 self-start">
          <Card className="border-2 border-primary-200">
            <CardContent className="p-6">
              <h2 className="font-display text-2xl font-bold mb-2">Залишити відгук ✨</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Поділіться вашими враженнями. Відгук з'явиться після модерації адміністратором.
              </p>

              {submitted && (
                <div className="mb-4 p-3 rounded-2xl bg-green-50 text-green-800 text-sm border border-green-200 flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <strong>Дякуємо!</strong> Ваш відгук відправлено на модерацію.
                    Він з'явиться на сайті після перевірки адміністратором.
                  </div>
                </div>
              )}

              {submitError && (
                <div className="mb-4 p-3 rounded-2xl bg-red-50 text-red-800 text-sm border border-red-200 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <strong>Помилка:</strong> {submitError}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <input type="text" {...register('website')} className="hidden" tabIndex={-1} autoComplete="off" />

                <div>
                  <Label htmlFor="author">Ваше ім'я *</Label>
                  <Input id="author" placeholder="Олена Петрівна" {...register('author')} />
                  {errors.author && <p className="text-xs text-destructive mt-1">{errors.author.message}</p>}
                </div>

                <div>
                  <Label htmlFor="child_group">Група дитини</Label>
                  <Input id="child_group" placeholder="напр. Сонечко" {...register('child_group')} />
                </div>

                <div>
                  <Label>Оцінка *</Label>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setValue('rating', n)}
                        className="p-1"
                        aria-label={`Оцінка ${n}`}
                      >
                        <Star
                          className={cn(
                            'h-7 w-7 transition-colors',
                            n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="text">Ваш відгук *</Label>
                  <Textarea
                    id="text"
                    placeholder="Поділіться вашими враженнями про садочок..."
                    rows={5}
                    {...register('text')}
                  />
                  {errors.text && <p className="text-xs text-destructive mt-1">{errors.text.message}</p>}
                </div>

                <Button type="submit" variant="gradient" className="w-full" disabled={createReview.isPending}>
                  {createReview.isPending ? 'Надсилаємо...' : <>Надіслати відгук <Send className="h-4 w-4" /></>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
