import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, Mail, Clock, Trash2, Check, Save, Baby, Cake } from 'lucide-react';
import { toast } from 'sonner';
import { adminEnrollmentApi } from '../lib/adminApi';
import { FilterTabs, ActButton, ListSkeleton, EmptyBox } from '../components/AdminUI';
import { formatDate, cn } from '@/lib/utils';
import type { AdminEnrollment, EnrollmentStatus } from '../types';

type Filter = 'new' | 'all';

const STATUS_META: Record<EnrollmentStatus, { label: string; cls: string }> = {
  new:        { label: '🆕 Нова',      cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
  processing: { label: '👀 В обробці',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  approved:   { label: '✅ Схвалено',   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  rejected:   { label: '🚫 Відхилено',  cls: 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300' },
  done:       { label: '🏁 Завершено',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
};
const STATUS_ORDER: EnrollmentStatus[] = ['new', 'processing', 'approved', 'rejected', 'done'];

export function EnrollmentPage() {
  const [filter, setFilter] = useState<Filter>('new');
  const qc = useQueryClient();
  const { data: apps, isLoading } = useQuery({
    queryKey: ['admin-enrollment', filter],
    queryFn: () => adminEnrollmentApi.list(filter === 'all' ? '' : 'new'),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-enrollment'] });
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
  };
  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Pick<AdminEnrollment, 'status' | 'admin_note'>> }) =>
      adminEnrollmentApi.update(id, data),
    onSuccess: () => { toast.success('Збережено'); invalidate(); }, onError: () => toast.error('Помилка'),
  });
  const remove = useMutation({
    mutationFn: adminEnrollmentApi.remove,
    onSuccess: () => { toast.success('Видалено'); invalidate(); }, onError: () => toast.error('Помилка'),
  });

  return (
    <div className="space-y-5 animate-page-fade-in">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Заявки на зарахування</h1>
        <p className="text-gray-500 dark:text-slate-400 font-medium">Онлайн-заявки батьків із сайту</p>
      </div>

      <FilterTabs value={filter} onChange={setFilter} tabs={[
        { value: 'new', label: 'Нові', count: apps && filter === 'new' ? apps.length : undefined },
        { value: 'all', label: 'Усі' },
      ]} />

      {isLoading ? <ListSkeleton /> : !apps?.length ? (
        <EmptyBox text="Немає заявок у цьому фільтрі" />
      ) : (
        <div className="space-y-4">
          {apps.map(a => (
            <EnrollmentCard
              key={a.id}
              app={a}
              onSave={data => update.mutate({ id: a.id, data })}
              onRemove={() => { if (window.confirm('Видалити заявку?')) remove.mutate(a.id); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EnrollmentCard({ app, onSave, onRemove }: {
  app: AdminEnrollment;
  onSave: (data: Partial<Pick<AdminEnrollment, 'status' | 'admin_note'>>) => void;
  onRemove: () => void;
}) {
  const [status, setStatus] = useState<EnrollmentStatus>(app.status);
  const [note, setNote] = useState(app.admin_note || '');
  const meta = STATUS_META[app.status];
  const dirty = status !== app.status || note !== (app.admin_note || '');

  return (
    <div className="premium-glass rounded-[1.5rem] p-5">
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 grid place-items-center shrink-0"><Baby size={18} /></span>
          <div>
            <span className="font-black text-gray-900 dark:text-white">{app.child_name}</span>
            <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1.5">
              <Cake size={11} /> {formatDate(app.child_birth_date)}
              {app.desired_start && <span>· бажаний початок: {app.desired_start}</span>}
            </p>
          </div>
        </div>
        <span className={cn('text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap', meta.cls)}>{meta.label}</span>
      </div>

      <div className="rounded-2xl bg-white/60 dark:bg-slate-800/50 p-3 mb-3 text-sm space-y-1">
        <p className="font-bold text-gray-800 dark:text-slate-100">{app.parent_name}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <a href={`tel:${app.phone}`} className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline"><Phone size={13} /> {app.phone}</a>
          {app.email && <a href={`mailto:${app.email}`} className="inline-flex items-center gap-1 text-gray-600 dark:text-slate-300 hover:underline"><Mail size={13} /> {app.email}</a>}
        </div>
        {app.note && <p className="text-gray-600 dark:text-slate-300 whitespace-pre-wrap pt-1">{app.note}</p>}
      </div>

      <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1.5 mb-4 flex-wrap">
        <Clock size={12} /> Подано: {formatDate(app.created_at)}
        {app.handled_by_name && <span>· опрацював(ла): {app.handled_by_name}</span>}
      </p>

      <div className="mb-3">
        <label className="block text-xs font-bold mb-1.5 text-gray-500 dark:text-slate-400 uppercase">Статус</label>
        <select value={status} onChange={e => setStatus(e.target.value as EnrollmentStatus)}
          className="w-full sm:w-64 px-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium text-gray-900 dark:text-white">
          {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
      </div>

      <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
        placeholder="Нотатка: результат розмови, домовленості…"
        className="w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-400 text-sm mb-3 text-gray-900 dark:text-white" />

      <div className="flex flex-wrap gap-2">
        <ActButton color="blue" icon={Save} disabled={!dirty}
          onClick={() => onSave({ status, admin_note: note })}>Зберегти</ActButton>
        {app.status === 'new' && (
          <ActButton color="emerald" icon={Check}
            onClick={() => { setStatus('approved'); onSave({ status: 'approved', admin_note: note }); }}>Схвалити</ActButton>
        )}
        <ActButton color="rose" icon={Trash2} onClick={onRemove}>Видалити</ActButton>
      </div>
    </div>
  );
}
