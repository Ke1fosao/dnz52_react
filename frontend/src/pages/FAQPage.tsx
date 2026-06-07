import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown, ThumbsUp, Search, HelpCircle, Send, MessageCircle } from 'lucide-react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { RichContent } from '@/components/common/RichContent';
import { Turnstile } from '@/components/common/Turnstile';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useFaq, useLikeFaqItem, useAskQuestion } from '@/hooks/useApi';
import { celebrate } from '@/lib/confetti';
import { cn } from '@/lib/utils';

const LIKED_KEY = 'dnz52:likedFaq';
function readLiked(): number[] {
  try { return JSON.parse(localStorage.getItem(LIKED_KEY) || '[]'); } catch { return []; }
}
function addLiked(id: number) {
  try {
    const a = readLiked();
    if (!a.includes(id)) localStorage.setItem(LIKED_KEY, JSON.stringify([...a, id]));
  } catch { /* ignore */ }
}

const askSchema = z.object({
  name: z.string().min(2, 'Введіть ваше імʼя'),
  phone: z.string().min(5, 'Введіть номер телефону'),
  question: z.string().min(5, 'Опишіть ваше запитання'),
  website: z.string().optional(),
});
type AskForm = z.infer<typeof askSchema>;

export function FAQPage() {
  const { data: groups, isLoading } = useFaq();
  const likeItem = useLikeFaqItem();
  const askQuestion = useAskQuestion();

  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [liked, setLiked] = useState<number[]>(() => readLiked());

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AskForm>({ resolver: zodResolver(askSchema) });
  const turnstileTokenRef = useRef('');

  const onLike = (id: number) => {
    if (liked.includes(id)) return;
    addLiked(id);
    setLiked(prev => [...prev, id]);
    likeItem.mutate(id);
  };

  const onAsk = async (data: AskForm) => {
    try {
      await askQuestion.mutateAsync({
        ...data,
        'cf-turnstile-response': turnstileTokenRef.current,
      } as AskForm & { 'cf-turnstile-response': string });
      reset();
      celebrate();
      toast.success('Дякуємо! Ми отримали ваше запитання.', { description: 'Незабаром зателефонуємо вам.', duration: 6000 });
    } catch (err) {
      const ax = err as AxiosError<{ detail?: string }>;
      toast.error('Помилка', { description: ax.response?.data?.detail || 'Спробуйте пізніше.', duration: 7000 });
    }
  };

  const filtered = (groups || [])
    .map(g => ({ ...g, items: g.items.filter(it => !query || (it.question + ' ' + it.answer).toLowerCase().includes(query.toLowerCase())) }))
    .filter(g => g.items.length > 0);

  const totalItems = (groups || []).reduce((s, g) => s + g.items.length, 0);

  return (
    <div className="container mx-auto px-4 max-w-5xl">
      <Seo title="Поширені запитання" description="Відповіді на поширені запитання батьків про заклад дошкільної освіти №52" />
      <PageHero title="Поширені запитання" subtitle="Відповіді на те, що батьки питають найчастіше" icon="❓" />

      <div className="pb-12 space-y-6">
        {totalItems > 0 && (
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Пошук серед запитань…"
              className="w-full pl-14 pr-5 h-14 rounded-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm text-gray-800 dark:text-slate-100 font-medium outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
            />
          </div>
        )}

        {isLoading ? (
          <Spinner />
        ) : totalItems === 0 ? (
          <EmptyState icon={<HelpCircle className="h-12 w-12" />} title="Поки немає запитань"
            description="Скоро тут зʼявляться відповіді на поширені запитання батьків" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Search className="h-12 w-12" />} title="Нічого не знайдено"
            description="Спробуйте інакше сформулювати запит — або поставте своє запитання нижче" />
        ) : (
          filtered.map(group => (
            <section key={group.id}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0" style={{ background: `linear-gradient(135deg, ${group.color}, ${group.color}cc)` }}>
                  <i className={`${group.icon} text-xl`} aria-hidden />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{group.name}</h2>
              </div>
              <div className="space-y-3">
                {group.items.map(item => {
                  const open = openId === item.id;
                  const isLiked = liked.includes(item.id);
                  return (
                    <div key={item.id} className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                      <button onClick={() => setOpenId(open ? null : item.id)} className="w-full flex items-center justify-between gap-4 p-5 text-left">
                        <span className="font-bold text-gray-900 dark:text-white">{item.question}</span>
                        <ChevronDown size={20} className={cn('shrink-0 text-gray-400 transition-transform duration-300', open && 'rotate-180')} style={open ? { color: group.color } : undefined} />
                      </button>
                      {open && (
                        <div className="px-5 pb-5 animate-scale-in">
                          <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
                            <RichContent content={item.answer} />
                            <button
                              onClick={() => onLike(item.id)}
                              disabled={isLiked}
                              className={cn('mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors',
                                isLiked
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 cursor-default'
                                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20')}
                            >
                              <ThumbsUp size={15} className={cn(isLiked && 'fill-current')} /> Корисно{item.likes > 0 ? ` · ${item.likes}` : ''}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}

        {/* Не знайшли відповідь — форма запитання */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-800/50 rounded-[2rem] p-6 md:p-8 border border-blue-100 dark:border-slate-700 mt-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="text-blue-500 dark:text-blue-400 shrink-0" size={26} />
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Не знайшли відповідь?</h2>
          </div>
          <p className="text-gray-500 dark:text-slate-400 mb-5 font-medium">Залиште запитання — ми зателефонуємо і все детально пояснимо.</p>
          <form onSubmit={handleSubmit(onAsk)} className="grid sm:grid-cols-2 gap-4">
            <input type="text" {...register('website')} className="hidden" tabIndex={-1} autoComplete="off" />
            <div>
              <Label htmlFor="faq-name">Ваше імʼя *</Label>
              <Input id="faq-name" placeholder="Олена Петрівна" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="faq-phone">Телефон *</Label>
              <Input id="faq-phone" placeholder="+380…" {...register('phone')} />
              {errors.phone && <p className="text-xs text-red-500 mt-1 font-medium">{errors.phone.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="faq-q">Ваше запитання *</Label>
              <Textarea id="faq-q" rows={4} placeholder="Що б ви хотіли дізнатися?" {...register('question')} />
              {errors.question && <p className="text-xs text-red-500 mt-1 font-medium">{errors.question.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <Turnstile
                onToken={t => { turnstileTokenRef.current = t; }}
                onExpire={() => { turnstileTokenRef.current = ''; }}
              />
            </div>
            <button type="submit" disabled={askQuestion.isPending}
              className="sm:col-span-2 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3.5 rounded-full shadow-lg hover:-translate-y-0.5 transition-transform disabled:opacity-60">
              {askQuestion.isPending ? 'Надсилаємо…' : <>Надіслати запитання <Send size={16} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
