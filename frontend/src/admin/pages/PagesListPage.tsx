import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { adminPagesApi } from '../lib/adminApi';
import { ListSkeleton, EmptyBox } from '../components/AdminUI';

export function PagesListPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-pages'], queryFn: adminPagesApi.list });
  const remove = useMutation({ mutationFn: adminPagesApi.remove, onSuccess: () => { toast.success('Видалено'); qc.invalidateQueries({ queryKey: ['admin-pages'] }); }, onError: () => toast.error('Помилка') });

  return (
    <div className="space-y-5 animate-page-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Сторінки</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Інформаційні сторінки сайту (/page/&lt;slug&gt;)</p>
        </div>
        <Link to="/manage/pages/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"><Plus size={18} /> Додати сторінку</Link>
      </div>
      {isLoading ? <ListSkeleton /> : !data?.length ? <EmptyBox text="Ще немає сторінок" /> : (
        <div className="space-y-3">
          {data.map(p => (
            <div key={p.id} className="premium-glass rounded-[1.5rem] p-4 flex items-center gap-4">
              {p.image
                ? <img src={p.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                : <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-500 grid place-items-center shrink-0"><FileText size={22} /></div>}
              <div className="flex-1 min-w-0">
                {!p.is_published && <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 uppercase mb-0.5 inline-block">Прихована</span>}
                <h3 className="font-black text-gray-900 dark:text-white truncate">{p.title}</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-mono truncate">/page/{p.slug}</p>
              </div>
              <Link to={`/manage/pages/${p.id}/edit`} className="w-9 h-9 grid place-items-center rounded-xl bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0" aria-label="Редагувати"><Pencil size={16} /></Link>
              <button onClick={() => { if (window.confirm('Видалити сторінку?')) remove.mutate(p.id); }} className="w-9 h-9 grid place-items-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors shrink-0" aria-label="Видалити"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
