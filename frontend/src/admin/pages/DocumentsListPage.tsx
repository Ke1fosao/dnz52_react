import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { adminDocumentsApi } from '../lib/adminApi';
import { ListSkeleton, EmptyBox } from '../components/AdminUI';
import { formatDate } from '@/lib/utils';

export function DocumentsListPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-documents'], queryFn: adminDocumentsApi.list });
  const remove = useMutation({
    mutationFn: adminDocumentsApi.remove,
    onSuccess: () => { toast.success('Видалено'); qc.invalidateQueries({ queryKey: ['admin-documents'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); },
    onError: () => toast.error('Помилка'),
  });

  return (
    <div className="space-y-5 animate-page-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Документи</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Файли для завантаження відвідувачами</p>
        </div>
        <Link to="/manage/documents/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
          <Plus size={18} /> Додати документ
        </Link>
      </div>

      {isLoading ? <ListSkeleton /> : !data?.length ? <EmptyBox text="Ще немає документів" /> : (
        <div className="space-y-3">
          {data.map(d => (
            <div key={d.id} className="premium-glass rounded-[1.5rem] p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-500 grid place-items-center shrink-0"><FileText size={22} /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  {d.category_name && <span className="text-xs text-gray-400 dark:text-slate-500">{d.category_name}</span>}
                  {!d.is_published && <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 uppercase">Прихований</span>}
                </div>
                <h3 className="font-black text-gray-900 dark:text-white truncate">{d.title}</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500">{d.file_size} · ⬇ {d.downloads} · {formatDate(d.created_at)}</p>
              </div>
              <a href={d.file} target="_blank" rel="noreferrer" className="w-9 h-9 grid place-items-center rounded-xl bg-white/60 dark:bg-slate-800/60 text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0" aria-label="Відкрити"><Download size={16} /></a>
              <Link to={`/manage/documents/${d.id}/edit`} className="w-9 h-9 grid place-items-center rounded-xl bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0" aria-label="Редагувати"><Pencil size={16} /></Link>
              <button onClick={() => { if (window.confirm('Видалити документ?')) remove.mutate(d.id); }} className="w-9 h-9 grid place-items-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors shrink-0" aria-label="Видалити"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
