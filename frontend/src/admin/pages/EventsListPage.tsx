import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, MapPin, Calendar, Tags } from 'lucide-react';
import { toast } from 'sonner';
import { adminEventsApi, adminEventTypesApi } from '../lib/adminApi';
import { ListSkeleton, EmptyBox, SearchInput, CollapsiblePanel } from '../components/AdminUI';
import { CategoryManager } from '../components/CategoryManager';
import { formatDate } from '@/lib/utils';

export function EventsListPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['admin-events'], queryFn: adminEventsApi.list });
  const remove = useMutation({
    mutationFn: adminEventsApi.remove,
    onSuccess: () => { toast.success('Видалено'); qc.invalidateQueries({ queryKey: ['admin-events'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); },
    onError: () => toast.error('Помилка'),
  });
  const filtered = (data || []).filter(e => e.title.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="space-y-5 animate-page-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Події</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Календар подій садочка</p>
        </div>
        <Link to="/manage/events/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
          <Plus size={18} /> Додати подію
        </Link>
      </div>

      <CollapsiblePanel title="Типи подій" icon={Tags}><CategoryManager qKey="event-type" api={adminEventTypesApi} hasColor hasOrder /></CollapsiblePanel>

      {data && data.length > 6 && <SearchInput value={q} onChange={setQ} placeholder="Пошук події за назвою…" />}

      {isLoading ? <ListSkeleton /> : !data?.length ? <EmptyBox text="Ще немає подій" /> : !filtered.length ? <EmptyBox text="Нічого не знайдено" /> : (
        <div className="space-y-3">
          {filtered.map(e => (
            <div key={e.id} className="premium-glass rounded-[1.5rem] p-4 flex items-center gap-4">
              {e.image
                ? <img src={e.image} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                : <div className="w-16 h-16 rounded-xl bg-pink-100 dark:bg-pink-900/30 grid place-items-center text-2xl shrink-0">📅</div>}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">{e.event_type_display}</span>
                  {!e.is_published && <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 uppercase">Прихована</span>}
                </div>
                <h3 className="font-black text-gray-900 dark:text-white truncate">{e.title}</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Calendar size={12} /> {formatDate(e.start_date)}{e.location && <> · <MapPin size={12} /> {e.location}</>}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Link to={`/manage/events/${e.id}/edit`} className="w-9 h-9 grid place-items-center rounded-xl bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition-colors" aria-label="Редагувати"><Pencil size={16} /></Link>
                <button onClick={() => { if (window.confirm('Видалити подію?')) remove.mutate(e.id); }} className="w-9 h-9 grid place-items-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors" aria-label="Видалити"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
