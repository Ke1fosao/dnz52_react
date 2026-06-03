import { useState } from 'react';
import { Bell, Newspaper, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { usePush } from '@/hooks/usePush';
import { cn } from '@/lib/utils';

const TOPICS = [
  { key: 'news', label: 'Новини', desc: 'Нові статті й оголошення', icon: Newspaper },
  { key: 'events', label: 'Події', desc: 'Свята, збори, заходи', icon: CalendarDays },
];

const TOPICS_KEY = 'dnz52:pushTopics';
function readTopics(): string[] {
  try { return JSON.parse(localStorage.getItem(TOPICS_KEY) || '[]'); } catch { return []; }
}
function writeTopics(t: string[]) {
  try { localStorage.setItem(TOPICS_KEY, JSON.stringify(t)); } catch { /* ignore */ }
}

/**
 * Дзвіночок підписки на push-сповіщення за темами.
 *  • за замовчуванням — кнопка-дзвіночок із випадаючою панеллю (десктоп-навбар);
 *  • inline — одразу показує перемикачі тем (для мобільного меню).
 */
export function NotificationBell({ inline = false }: { inline?: boolean }) {
  const { status, loading, subscribe, unsubscribe, isSupported } = usePush();
  const [open, setOpen] = useState(false);
  const [topics, setTopics] = useState<string[]>(() => readTopics());

  if (!isSupported || status === 'unsupported') return null;

  const anyOn = status === 'subscribed' && topics.length > 0;

  const toggle = async (key: string) => {
    if (status === 'denied') {
      toast.error('Сповіщення заблоковані в налаштуваннях браузера');
      return;
    }
    const next = topics.includes(key) ? topics.filter(t => t !== key) : [...topics, key];
    if (next.length === 0) {
      await unsubscribe();
      setTopics([]); writeTopics([]);
      toast.success('Сповіщення вимкнено');
      return;
    }
    const ok = await subscribe(next);
    if (ok) {
      setTopics(next); writeTopics(next);
      toast.success('Налаштування сповіщень збережено 🔔');
    } else {
      toast.error('Не вдалось увімкнути сповіщення');
    }
  };

  const toggles = (
    <div className="space-y-1.5">
      {TOPICS.map(t => {
        const on = topics.includes(t.key);
        return (
          <button key={t.key} onClick={() => toggle(t.key)} disabled={loading}
            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors text-left disabled:opacity-60">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
              on ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500')}>
              <t.icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-gray-900 dark:text-white">{t.label}</div>
              <div className="text-xs text-gray-400 dark:text-slate-500">{t.desc}</div>
            </div>
            <span className={cn('relative w-11 h-6 rounded-full transition-colors shrink-0', on ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-700')}>
              <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200', on ? 'left-[22px]' : 'left-0.5')} />
            </span>
          </button>
        );
      })}
    </div>
  );

  const deniedNote = status === 'denied' && (
    <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 font-medium px-1">⚠️ Дозвіл заблоковано в браузері — увімкніть його в налаштуваннях сайту.</p>
  );

  // Inline-режим — для мобільного меню
  if (inline) {
    return (
      <div className="bg-white/50 dark:bg-slate-800/50 rounded-3xl p-4 mt-2">
        <div className="flex items-center gap-2 mb-1 px-1">
          <Bell size={18} className="text-blue-500" />
          <h4 className="font-black text-gray-900 dark:text-white">Сповіщення</h4>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 px-1 font-medium">Оберіть, про що повідомляти у браузері</p>
        {toggles}
        {deniedNote}
      </div>
    );
  }

  // Дефолт — кнопка-дзвіночок із панеллю (десктоп)
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} aria-label="Сповіщення"
        className="relative w-12 h-12 rounded-full flex items-center justify-center text-gray-900 dark:text-white shadow-sm hover:scale-105 transition-transform bg-white dark:bg-slate-800 border border-white dark:border-slate-700">
        <Bell size={20} />
        {anyOn && <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white dark:ring-slate-800" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[105]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 glass-dropdown rounded-[1.5rem] p-4 z-[110] animate-scale-in">
            <div className="flex items-center gap-2 mb-1">
              <Bell size={18} className="text-blue-500" />
              <h4 className="font-black text-gray-900 dark:text-white">Сповіщення</h4>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 font-medium">Оберіть, про що повідомляти у браузері</p>
            {toggles}
            {deniedNote}
          </div>
        </>
      )}
    </div>
  );
}
