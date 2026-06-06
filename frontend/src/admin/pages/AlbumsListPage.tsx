import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Images } from 'lucide-react';
import { toast } from 'sonner';
import { adminGalleryAlbumsApi } from '../lib/adminApi';
import { ListSkeleton, EmptyBox } from '../components/AdminUI';
import { formatDate } from '@/lib/utils';

export function AlbumsListPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-gallery-albums'], queryFn: adminGalleryAlbumsApi.list });
  const remove = useMutation({
    mutationFn: adminGalleryAlbumsApi.remove,
    onSuccess: () => { toast.success('Альбом видалено'); qc.invalidateQueries({ queryKey: ['admin-gallery-albums'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); },
    onError: () => toast.error('Помилка'),
  });

  return (
    <div className="space-y-5 animate-page-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Фотогалерея</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Альбоми та фотографії на сайті</p>
        </div>
        <Link to="/manage/albums/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
          <Plus size={18} /> Додати альбом
        </Link>
      </div>

      {isLoading ? <ListSkeleton /> : !data?.length ? <EmptyBox text="Ще немає альбомів" /> : (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.map(a => (
            <div key={a.id} className="premium-glass rounded-[1.5rem] p-3 flex items-center gap-4">
              {a.cover
                ? <img src={a.cover} alt="" className="w-20 h-20 rounded-2xl object-cover shrink-0" />
                : <div className="w-20 h-20 rounded-2xl bg-blue-100 dark:bg-blue-900/30 grid place-items-center shrink-0 text-blue-500"><Images size={26} /></div>}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  {a.category_name && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{a.category_name}</span>}
                  {!a.is_published && <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 uppercase">Прихований</span>}
                </div>
                <h3 className="font-black text-gray-900 dark:text-white truncate">{a.title}</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500">🖼️ {a.photos_count} фото · {formatDate(a.created_at)}</p>
              </div>
              <Link to={`/manage/albums/${a.id}/edit`} className="w-9 h-9 grid place-items-center rounded-xl bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0" aria-label="Редагувати"><Pencil size={16} /></Link>
              <button onClick={() => { if (window.confirm(`Видалити альбом «${a.title}» з усіма фото?`)) remove.mutate(a.id); }} className="w-9 h-9 grid place-items-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors shrink-0" aria-label="Видалити"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
