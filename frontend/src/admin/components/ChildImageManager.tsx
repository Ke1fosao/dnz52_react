import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Trash2, Loader2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { SortableList, persistOrder } from './SortableList';

interface ChildImg { id: number; image: string; caption: string; order: number }
interface ChildImgApi<T> {
  listFor: (parentId: number) => Promise<T[]>;
  create: (data: FormData | object) => Promise<T>;
  update: (id: number, data: FormData | object) => Promise<T>;
  remove: (id: number) => Promise<unknown>;
}

// Універсальна інлайн-галерея дочірніх фото (додати кілька одразу, підпис, сортування, видалення).
export function ChildImageManager<T extends ChildImg>({ parentId, parentKey, api, qKey }: {
  parentId: number; parentKey: string; api: ChildImgApi<T>; qKey: string;
}) {
  const qc = useQueryClient();
  const key = ['admin-child-images', qKey, parentId];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => api.listFor(parentId) });
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const invalidate = () => qc.invalidateQueries({ queryKey: key });
  const photos = data || [];

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setUploading(true);
    try {
      const start = photos.length;
      for (let i = 0; i < list.length; i++) {
        const fd = new FormData();
        fd.append(parentKey, String(parentId));
        fd.append('image', list[i]);
        fd.append('order', String(start + i));
        await api.create(fd);
      }
      toast.success('Фото додано'); invalidate();
    } catch { toast.error('Помилка завантаження'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const saveCaption = useMutation({
    mutationFn: ({ id, caption }: { id: number; caption: string }) => api.update(id, { caption }),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: api.remove, onSuccess: () => { toast.success('Видалено'); invalidate(); }, onError: () => toast.error('Помилка') });

  const handleReorder = async (next: T[]) => {
    qc.setQueryData(key, next);
    try { await persistOrder(next, (id, data) => api.update(id, data)); } catch { toast.error('Помилка'); }
    invalidate();
  };

  return (
    <div className="space-y-3">
      <label className="cursor-pointer inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 font-bold text-sm px-4 py-2.5 rounded-xl text-gray-700 dark:text-slate-300 transition-colors">
        {uploading ? <Loader2 className="animate-spin" size={16} /> : <ImagePlus size={16} />} Додати фото
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => onFiles(e.target.files)} />
      </label>
      {isLoading ? <p className="text-sm text-gray-400 dark:text-slate-500">Завантаження…</p>
        : !photos.length ? <p className="text-sm text-gray-400 dark:text-slate-500">Ще немає фото</p>
        : (
          <SortableList items={photos} getId={p => p.id} onReorder={handleReorder} className="space-y-2">
            {(p, dnd) => (
              <div ref={dnd.setNodeRef} style={dnd.style} className="flex items-center gap-3 premium-glass rounded-2xl p-2.5">
                <button {...dnd.handleProps} className="cursor-grab active:cursor-grabbing touch-none text-gray-300 dark:text-slate-600 hover:text-gray-500 shrink-0" aria-label="Перетягнути"><GripVertical size={17} /></button>
                <img src={p.image} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                <input
                  defaultValue={p.caption}
                  onBlur={e => { if (e.target.value !== p.caption) saveCaption.mutate({ id: p.id, caption: e.target.value }); }}
                  placeholder="Підпис (необов'язково)…"
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm text-gray-700 dark:text-slate-300 border-b border-transparent focus:border-blue-400 py-1"
                />
                <button type="button" onClick={() => { if (window.confirm('Видалити фото?')) remove.mutate(p.id); }} className="w-8 h-8 grid place-items-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors shrink-0"><Trash2 size={15} /></button>
              </div>
            )}
          </SortableList>
        )}
    </div>
  );
}
