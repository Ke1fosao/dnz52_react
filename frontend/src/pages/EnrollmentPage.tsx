import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { ClipboardCheck, Send, CheckCircle2, Home, Baby, Phone, Mail, CalendarDays, User } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Turnstile } from '@/components/common/Turnstile';
import { api } from '@/api/client';
import { celebrate } from '@/lib/confetti';

const schema = z.object({
  child_name: z.string().min(2, "Вкажіть ім'я дитини"),
  child_birth_date: z.string().min(1, 'Вкажіть дату народження'),
  parent_name: z.string().min(2, "Вкажіть ваше ім'я"),
  phone: z.string().min(5, 'Вкажіть номер телефону'),
  email: z.string().email('Невірний формат email').optional().or(z.literal('')),
  desired_start: z.string().optional(),
  note: z.string().optional(),
  consent: z.boolean().refine(v => v === true, { message: 'Потрібна згода на обробку персональних даних' }),
  website: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function EnrollmentPage() {
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const turnstileTokenRef = useRef('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setPending(true);
    try {
      const { consent, ...payload } = data;
      void consent;
      await api.post('/enrollment/', { ...payload, 'cf-turnstile-response': turnstileTokenRef.current });
      reset();
      setSubmitted(true);
      celebrate();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const ax = err as AxiosError<{ detail?: string; [k: string]: unknown }>;
      const d = ax.response?.data;
      let message = 'Не вдалося надіслати заявку. Спробуйте пізніше.';
      if (d?.detail) message = String(d.detail);
      else if (d && typeof d === 'object') {
        const errs = Object.entries(d).map(([f, e]) => Array.isArray(e) ? `${f}: ${e.join(', ')}` : `${f}: ${e}`).join('; ');
        if (errs) message = errs;
      }
      toast.error('Помилка', { description: message, duration: 8000 });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-3xl pb-16">
      <Seo
        title="Онлайн-заявка на зарахування"
        description="Подати заявку на зарахування дитини до закладу дошкільної освіти №52, м. Рівне — швидко та зручно онлайн."
      />
      <PageHero
        title="Заявка на зарахування"
        subtitle="Подайте заявку онлайн — і ми зв'яжемося з вами"
        icon="📝"
        variant="sky"
      />

      {submitted ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 md:p-12 shadow-lg border border-gray-100 dark:border-slate-800 text-center animate-scale-in">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-11 h-11 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Дякуємо! Заявку отримано 🎉</h2>
          <p className="text-gray-500 dark:text-slate-400 font-medium mb-8 max-w-lg mx-auto leading-relaxed">
            Ми розглянемо вашу заявку та зв'яжемося з вами найближчим часом за вказаним номером телефону.
            Якщо маєте термінові питання — завітайте на сторінку «Контакти».
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 px-7 rounded-full shadow-md hover:-translate-y-0.5 transition-transform">
              <Home size={18} /> На головну
            </Link>
            <button onClick={() => setSubmitted(false)} className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold py-3 px-7 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
              Подати ще одну
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-9 shadow-lg border border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0">
              <ClipboardCheck size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">Заповніть заявку</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Поля з зірочкою (*) — обов'язкові</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-6">
            {/* honeypot */}
            <input type="text" {...register('website')} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

            <fieldset className="space-y-4">
              <legend className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1.5"><Baby size={14} /> Дані дитини</legend>
              <div>
                <Label htmlFor="child_name">Ім'я та прізвище дитини *</Label>
                <Input id="child_name" placeholder="напр. Софія Коваленко" {...register('child_name')} />
                {errors.child_name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.child_name.message}</p>}
              </div>
              <div>
                <Label htmlFor="child_birth_date"><CalendarDays size={13} className="inline -mt-0.5 mr-1" />Дата народження *</Label>
                <Input id="child_birth_date" type="date" {...register('child_birth_date')} />
                {errors.child_birth_date && <p className="text-xs text-red-500 mt-1 font-medium">{errors.child_birth_date.message}</p>}
              </div>
              <div>
                <Label htmlFor="desired_start">Бажаний початок відвідування</Label>
                <Input id="desired_start" placeholder="напр. вересень 2026" {...register('desired_start')} />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1.5"><User size={14} /> Контакти батьків</legend>
              <div>
                <Label htmlFor="parent_name">Ваше ім'я *</Label>
                <Input id="parent_name" placeholder="напр. Олена Коваленко" {...register('parent_name')} />
                {errors.parent_name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.parent_name.message}</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone"><Phone size={13} className="inline -mt-0.5 mr-1" />Телефон *</Label>
                  <Input id="phone" type="tel" placeholder="+380 __ ___ __ __" {...register('phone')} />
                  {errors.phone && <p className="text-xs text-red-500 mt-1 font-medium">{errors.phone.message}</p>}
                </div>
                <div>
                  <Label htmlFor="email"><Mail size={13} className="inline -mt-0.5 mr-1" />Email</Label>
                  <Input id="email" type="email" placeholder="email@example.com" {...register('email')} />
                  {errors.email && <p className="text-xs text-red-500 mt-1 font-medium">{errors.email.message}</p>}
                </div>
              </div>
            </fieldset>

            <div>
              <Label htmlFor="note">Додаткова інформація</Label>
              <Textarea id="note" rows={3} placeholder="Особливі побажання, питання, особливості дитини…" {...register('note')} />
            </div>

            {/* Згода */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" {...register('consent')} className="mt-1 w-5 h-5 rounded accent-blue-600 shrink-0" />
              <span className="text-sm text-gray-600 dark:text-slate-400 font-medium leading-relaxed">
                Я даю згоду на обробку персональних даних відповідно до{' '}
                <Link to="/privacy" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Політики конфіденційності</Link>. *
              </span>
            </label>
            {errors.consent && <p className="text-xs text-red-500 -mt-2 font-medium">{errors.consent.message}</p>}

            <Turnstile
              onToken={t => { turnstileTokenRef.current = t; }}
              onExpire={() => { turnstileTokenRef.current = ''; }}
            />

            <button type="submit" disabled={pending}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 rounded-full shadow-lg hover:-translate-y-0.5 transition-transform disabled:opacity-60">
              {pending ? 'Надсилаємо…' : <>Подати заявку <Send size={16} /></>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
