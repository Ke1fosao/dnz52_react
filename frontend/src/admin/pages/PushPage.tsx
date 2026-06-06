import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Send, Loader2, BellRing, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { adminPushApi } from '../lib/adminApi';
import { Field, inputCls } from '../components/FormControls';
import { formatDate } from '@/lib/utils';

const TOPICS = [
  { value: '', label: 'Усі підписники' },
  { value: 'news', label: 'Лише підписані на новини' },
  { value: 'events', label: 'Лише підписані на події' },
];

export function PushPage() {
  const { data: stats } = useQuery({ queryKey: ['admin-push-subs'], queryFn: adminPushApi.subscriptions });
  const [form, setForm] = useState({ title: '', body: '', topic: '', url: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const send = useMutation({
    mutationFn: () => adminPushApi.send(form),
    onSuccess: (r) => toast.success(r.sent > 0 ? `Сповіщення надіслано ${r.sent} підписникам 🔔` : 'Немає активних підписників для цієї теми'),
    onError: (e: unknown) => toast.error((e as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Не вдалося надіслати'),
  });

  const submit = () => {
    if (!form.title.trim() || !form.body.trim()) { toast.error('Заповніть заголовок і текст'); return; }
    if (window.confirm(`Надіслати сповіщення «${form.title}» вибраним підписникам?`)) send.mutate();
  };

  return (
    <div className="space-y-5 animate-page-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Push-розсилка</h1>
        <p className="text-gray-500 dark:text-slate-400 font-medium">Надішліть сповіщення підписникам сайту</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="premium-glass rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white grid place-items-center shrink-0"><BellRing size={22} /></div>
          <div><p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{stats?.active ?? '—'}</p><p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">Активних підписок</p></div>
        </div>
        <div className="premium-glass rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-500 grid place-items-center shrink-0"><Smartphone size={22} /></div>
          <div><p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{stats?.total ?? '—'}</p><p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">Усього пристроїв</p></div>
        </div>
      </div>

      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <Field label="Заголовок" required><input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Напр. Нова подія у садочку!" maxLength={80} /></Field>
        <Field label="Текст сповіщення" required><textarea className={`${inputCls} resize-y`} rows={3} value={form.body} onChange={e => set('body', e.target.value)} placeholder="Короткий текст, який побачить підписник" maxLength={200} /></Field>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Кому надіслати">
            <select className={inputCls} value={form.topic} onChange={e => set('topic', e.target.value)}>{TOPICS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
          </Field>
          <Field label="Посилання при кліку" hint="Куди веде сповіщення (за замовч. — за темою)"><input className={inputCls} value={form.url} onChange={e => set('url', e.target.value)} placeholder="/news або /events" /></Field>
        </div>
        <button onClick={submit} disabled={send.isPending} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
          {send.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} Надіслати сповіщення
        </button>
      </div>

      {!!stats?.items?.length && (
        <div className="premium-glass rounded-[1.8rem] p-6">
          <h2 className="font-black text-lg text-gray-900 dark:text-white mb-3">Останні підписки</h2>
          <div className="space-y-2">
            {stats.items.slice(0, 12).map(s => (
              <div key={s.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-white/30 dark:border-white/5 last:border-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${s.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'}`} />
                <span className="font-medium text-gray-700 dark:text-slate-300 truncate flex-1">{s.user_agent}</span>
                {!!s.topics.length && <span className="text-[10px] font-bold text-blue-500 uppercase shrink-0">{s.topics.join(', ')}</span>}
                <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">{formatDate(s.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
