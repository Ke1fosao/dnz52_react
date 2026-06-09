import { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { m as motion } from '@/lib/motion';
import { MessageCircle, X, Send, Sparkles, Trash2, ArrowUpRight, Mic } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { RichContent } from '@/components/common/RichContent';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

type Source = { title: string; url: string; type: string };
type ChatMsg = { role: 'user' | 'assistant'; content: string; sources?: Source[] };

const STORAGE_KEY = 'dnz52:chat';

const SUGGESTIONS = [
  'Які документи потрібні для зарахування?',
  'Який режим роботи садочка?',
  'Які гуртки працюють?',
  'Чим годують дітей?',
];

const GREETING: ChatMsg = {
  role: 'assistant',
  content:
    'Привіт! 👋 Я **Сонечко** — помічник ЗДО №52. Запитайте мене про садочок: документи для '
    + 'зарахування, режим роботи, гуртки, харчування тощо.',
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch { /* ignore */ }
    return [GREETING];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Розмір видимої області (visualViewport) — щоб на мобільному чат підлаштовувався під клавіатуру
  const [vp, setVp] = useState<{ height: number; top: number } | null>(null);

  const reduced = useReducedMotion();
  const trapRef = useFocusTrap<HTMLDivElement>(open);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'uk-UA';

      rec.onresult = (e: any) => {
        let transcript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        setInput(transcript);
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Голосовий ввід не підтримується цим браузером.');
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
    } else {
      setInput('');
      recognitionRef.current.start();
      setListening(true);
    }
  };

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30))); } catch { /* ignore */ }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  }, [messages, loading, open, reduced, vp]);

  // Мобільна клавіатура: тримаємо панель у межах видимої області (visualViewport)
  useEffect(() => {
    if (!open) { setVp(null); return; }
    const vv = window.visualViewport;
    const isMobile = window.matchMedia('(max-width: 639px)').matches;
    if (!isMobile || !vv) { setVp(null); return; }
    const update = () => setVp({ height: vv.height, top: vv.offsetTop });
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    // На мобільному (повноекранний чат) блокуємо прокрутку фону
    const lockScroll = window.matchMedia('(max-width: 639px)').matches;
    if (lockScroll) document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setInput('');
    if (listening) recognitionRef.current?.stop();
    const history = messages.filter(m => m.content).slice(-6).map(m => ({ role: m.role, content: m.content }));
    const newId = Date.now().toString();
    
    setMessages(prev => [...prev, { role: 'user', content: q }, { role: 'assistant', content: '', sources: [], _id: newId } as any]);
    setLoading(true);
    
    try {
      const res = await fetch('/api/v1/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history })
      });
      
      if (!res.ok) throw new Error('Response error');
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      if (reader) {
        setLoading(false);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                if (data.sources && data.sources.length) {
                   setMessages(prev => prev.map(m => (m as any)._id === newId ? { ...m, sources: data.sources } : m));
                }

                if (data.text) {
                    const tokens = data.text.match(/.{1,3}/g) || [];
                    for (const token of tokens) {
                        setMessages(prev => prev.map(m => {
                            if ((m as any)._id === newId) {
                                return { ...m, content: m.content + token };
                            }
                            return m;
                        }));
                        await new Promise(r => setTimeout(r, 15));
                    }
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch {
      setMessages(prev => prev.map(m => {
        if ((m as any)._id === newId) {
          return { ...m, content: 'Вибачте, зараз не вдалося відповісти 😔 Спробуйте ще раз трохи згодом або скористайтеся пошуком.' };
        }
        return m;
      }));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); send(input); };

  return (
    <>
      {/* Кнопка-запускач */}
      <motion.button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Закрити чат-помічник' : 'Відкрити чат-помічник'}
        aria-expanded={open}
        whileHover={reduced ? undefined : { scale: 1.08, y: -3 }}
        whileTap={reduced ? undefined : { scale: 0.92 }}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full flex items-center justify-center
                   bg-gradient-to-br from-blue-500 to-indigo-600 text-white
                   shadow-[0_12px_32px_rgba(59,130,246,0.45)] ring-4 ring-white/40 dark:ring-slate-900/40"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-7 h-7" />
            </motion.span>
          ) : (
            <motion.span key="c" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} className="relative">
              <MessageCircle className="w-7 h-7" />
              {!reduced && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400" />
                </span>
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Панель чату */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={trapRef}
            role="dialog"
            aria-modal="false"
            aria-label="Чат-помічник Сонечко"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.35 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.35 }}
            transition={reduced
              ? { duration: 0.2 }
              : { scale: { type: 'spring', stiffness: 360, damping: 30, mass: 0.85 }, opacity: { duration: 0.18 } }}
            style={{ transformOrigin: 'bottom right', ...(vp ? { top: vp.top, height: vp.height, bottom: 'auto' } : {}) }}
            className="fixed z-[130] flex flex-col overflow-hidden
                       inset-0 rounded-none
                       sm:inset-auto sm:bottom-24 sm:right-6 sm:top-auto
                       sm:w-[384px] sm:h-[min(72vh,580px)] sm:rounded-3xl
                       border border-white/40 dark:border-slate-700/60
                       bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl
                       shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
          >
            {/* Шапка */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shrink-0">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">☀️</div>
              <div className="min-w-0 flex-1">
                <p className="font-black leading-tight">Помічник Сонечко</p>
                <p className="text-[11px] text-white/80 flex items-center gap-1"><Sparkles size={11} /> ШІ-асистент ЗДО №52</p>
              </div>
              <button onClick={() => setMessages([GREETING])} aria-label="Очистити діалог"
                className="p-2 rounded-full hover:bg-white/20 transition-colors" title="Очистити">
                <Trash2 size={18} />
              </button>
              <button onClick={() => setOpen(false)} aria-label="Закрити чат"
                className="p-2 rounded-full hover:bg-white/20 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Повідомлення */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-100 rounded-bl-md',
                  )}>
                    {msg.role === 'assistant'
                      ? <RichContent content={msg.content} className="prose-sm [&_p]:my-1 [&_ul]:my-1.5 [&_li]:my-0.5" />
                      : <span className="whitespace-pre-wrap">{msg.content}</span>}

                    {!!msg.sources?.length && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {msg.sources.map((s, j) => (
                          <Link key={j} to={s.url} onClick={() => setOpen(false)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full
                                       bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300
                                       hover:bg-blue-100 dark:hover:bg-blue-900/70 transition-colors max-w-[12rem] truncate">
                            {s.title} <ArrowUpRight size={11} className="shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
                    {[0, 1, 2].map(d => (
                      <span key={d} className="w-2 h-2 rounded-full bg-gray-400 dark:bg-slate-500 animate-bounce"
                        style={{ animationDelay: `${d * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Підказані питання — лише на старті */}
              {messages.length <= 1 && !loading && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)}
                      className="text-xs font-semibold text-left px-3 py-2 rounded-xl border border-blue-200 dark:border-slate-700
                                 text-blue-700 dark:text-blue-300 bg-white/60 dark:bg-slate-800/60
                                 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ввід */}
            <form onSubmit={onSubmit} className="p-3 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2 shrink-0">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                maxLength={500}
                placeholder="Напишіть запитання…"
                aria-label="Ваше запитання"
                className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 dark:bg-slate-800 text-sm
                           text-gray-900 dark:text-slate-100 placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <button type="button" onClick={toggleListening} aria-label="Голосовий ввід"
                  className={cn("w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-colors",
                    listening ? "bg-red-500 text-white animate-pulse" : "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600")}>
                  <Mic size={18} />
                </button>
                <button type="submit" disabled={!input.trim() && !loading} aria-label="Надіслати"
                  className="w-11 h-11 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center
                             hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Send size={18} />
                </button>
              </div>
            </form>
            <p className="px-4 pb-2 text-[10px] text-center text-gray-400 dark:text-slate-500 shrink-0">
              Відповіді ШІ можуть бути неточними. Уточнюйте важливе на сторінці «Контакти».
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
