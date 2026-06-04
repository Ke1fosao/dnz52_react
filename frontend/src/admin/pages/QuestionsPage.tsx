import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, Clock, Trash2, Check, Save } from 'lucide-react';
import { toast } from 'sonner';
import { adminQuestionsApi } from '../lib/adminApi';
import { FilterTabs, ActButton, ListSkeleton, EmptyBox } from '../components/AdminUI';
import { formatDate, cn } from '@/lib/utils';
import type { AdminQuestion, QuestionStatus } from '../types';

type Filter = 'new' | 'all' | 'done';

const STATUS_META: Record<QuestionStatus, { label: string; cls: string }> = {
  new:         { label: '🆕 Нове',         cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
  in_progress: { label: '👀 В обробці',     cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  callback:    { label: '📞 Передзвонити',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  done:        { label: '✅ Оброблено',     cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
};
const STATUS_ORDER: QuestionStatus[] = ['new', 'in_progress', 'callback', 'done'];

export function QuestionsPage() {
  const [filter, setFilter] = useState<Filter>('new');
  const qc = useQueryClient();
  const { data: questions, isLoading } = useQuery({
    queryKey: ['admin-questions', filter],
    queryFn: () => adminQuestionsApi.list(filter === 'all' ? '' : filter),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-questions'] });
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
  };
  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Pick<AdminQuestion, 'status' | 'admin_note' | 'callback_date'>> }) =>
      adminQuestionsApi.update(id, data),
    onSuccess: () => { toast.success('Збережено'); invalidate(); }, onError: () => toast.error('Помилка'),
  });
  const remove = useMutation({ mutationFn: adminQuestionsApi.remove, onSuccess: () => { toast.success('Видалено'); invalidate(); }, onError: () => toast.error('Помилка') });

  return (
    <div className="space-y-5 animate-page-fade-in">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Питання</h1>
        <p className="text-gray-500 dark:text-slate-400 font-medium">Запитання батьків (надіслані з сайту)</p>
      </div>

      <FilterTabs value={filter} onChange={setFilter} tabs={[
        { value: 'new', label: 'Нові', count: questions && filter === 'new' ? questions.length : undefined },
        { value: 'done', label: 'Оброблені' },
        { value: 'all', label: 'Усі' },
      ]} />

      {isLoading ? <ListSkeleton /> : !questions?.length ? (
        <EmptyBox text="Немає питань у цьому фільтрі" />
      ) : (
        <div className="space-y-4">
          {questions.map(q => (
            <QuestionCard
              key={q.id}
              question={q}
              onSave={data => update.mutate({ id: q.id, data })}
              onRemove={() => { if (window.confirm('Видалити запитання?')) remove.mutate(q.id); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionCard({ question, onSave, onRemove }: {
  question: AdminQuestion;
  onSave: (data: Partial<Pick<AdminQuestion, 'status' | 'admin_note' | 'callback_date'>>) => void;
  onRemove: () => void;
}) {
  const [status, setStatus] = useState<QuestionStatus>(question.status);
  const [note, setNote] = useState(question.admin_note || '');
  const [callback, setCallback] = useState(question.callback_date || '');
  const meta = STATUS_META[question.status];

  const dirty = status !== question.status || note !== (question.admin_note || '') || callback !== (question.callback_date || '');

  return (
    <div className="premium-glass rounded-[1.5rem] p-5">
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div>
          <span className="font-black text-gray-900 dark:text-white">{question.name}</span>
          <a href={`tel:${question.phone}`} className="ml-2 inline-flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
            <Phone size={13} /> {question.phone}
          </a>
        </div>
        <span className={cn('text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap', meta.cls)}>{meta.label}</span>
      </div>

      <p className="text-gray-600 dark:text-slate-300 mb-2 whitespace-pre-wrap">{question.question}</p>
      <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1.5 mb-4">
        <Clock size={12} /> {formatDate(question.created_at)}
        {question.handled_by_name && question.status === 'done' && <span>· обробив(ла): {question.handled_by_name}</span>}
      </p>

      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-bold mb-1.5 text-gray-500 dark:text-slate-400 uppercase">Статус</label>
          <select value={status} onChange={e => setStatus(e.target.value as QuestionStatus)}
            className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium text-gray-900 dark:text-white">
            {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>
        </div>
        {status === 'callback' && (
          <div>
            <label className="block text-xs font-bold mb-1.5 text-gray-500 dark:text-slate-400 uppercase">Дата дзвінка</label>
            <input type="date" value={callback || ''} onChange={e => setCallback(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-900 dark:text-white" />
          </div>
        )}
      </div>

      <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
        placeholder="Нотатка: про що говорили, що відповіли, результат…"
        className="w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-400 text-sm mb-3 text-gray-900 dark:text-white" />

      <div className="flex flex-wrap gap-2">
        <ActButton color="blue" icon={Save} disabled={!dirty}
          onClick={() => onSave({ status, admin_note: note, callback_date: status === 'callback' ? (callback || null) : null })}>
          Зберегти
        </ActButton>
        {question.status !== 'done' && (
          <ActButton color="emerald" icon={Check}
            onClick={() => { setStatus('done'); onSave({ status: 'done', admin_note: note }); }}>
            Позначити обробленим
          </ActButton>
        )}
        <ActButton color="rose" icon={Trash2} onClick={onRemove}>Видалити</ActButton>
      </div>
    </div>
  );
}
