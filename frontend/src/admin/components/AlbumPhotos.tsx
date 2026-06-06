import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Trash2, Loader2, RotateCw, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { adminGalleryPhotosApi } from '../lib/adminApi';
import { cn } from '@/lib/utils';

// Менеджер фото альбому: масове завантаження (drag&drop + прогрес), поворот 90°, сортування, підпис, видалення
export function AlbumPhotos({ albumId }: { albumId: number }) {
  const qc = useQueryClient();
  const key = ['admin-gallery-photos', albumId];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => adminGalleryPhotosApi.listFor(albumId) });
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [over, setOver] = useState(false);
  const [versions, setVersions] = useState<Record<number, number>>({}); // cache-bust після повороту

  const invalidate = () => qc.invalidateQueries({ queryKey: key });
  const photos = data || [];

  const upload = async (files: FileList | File[] | null) => {
    if (!files || !files.length) return;
    setUploading(true); setProgress(0);
    try {
      await adminGalleryPhotosApi.bulkUpload(albumId, files, setProgress);
      toast.success(`Завантажено фото: ${Array.from(files).length}`);
      invalidate();
    } catch { toast.error('Помилка завантаження'); }
    finally { setUploading(false); setProgress(0); if (fileRef.current) fileRef.current.value = ''; }
  };

  const saveTitle = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) => adminGalleryPhotosApi.update(id, { title }),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: adminGalleryPhotosApi.remove, onSuccess: () => { toast.success('Фото видалено'); invalidate(); }, onError: () => toast.error('Помилка') });
  const rotate = useMutation({
    mutationFn: ({ id, dir }: { id: number; dir: 'cw' | 'ccw' }) => adminGalleryPhotosApi.rotate(id, dir),
    onSuccess: (_d, v) => { setVersions(s => ({ ...s, [v.id]: Date.now() })); invalidate(); },
    onError: () => toast.error('Не вдалося повернути'),
  });

  const move = async (idx: number, dir: 'up' | 'down') => {
    const arr = [...photos];
    const j = dir === 'up' ? idx - 1 : idx + 1;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    const ups = arr.map((p, i) => (p.order !== i ? adminGalleryPhotosApi.update(p.id, { order: i }) : null)).filter(Boolean);
    await Promise.all(ups as Promise<unknown>[]);
    invalidate();
  };

  return (
    <div className="space-y-4">
      {/* Зона завантаження */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files); }}
        className={cn('cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors',
          over ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-900/20' : 'border-gray-300 dark:border-slate-600 hover:border-blue-400')}
      >
        {uploading ? (
          <div className="space-y-2">
            <Loader2 className="animate-spin mx-auto text-blue-500" size={28} />
            <div className="h-2 max-w-xs mx-auto bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm font-bold text-gray-500 dark:text-slate-400">Завантаження… {progress}%</p>
          </div>
        ) : (
          <>
            <ImagePlus className="mx-auto text-gray-400 dark:text-slate-500 mb-2" size={28} />
            <p className="font-bold text-gray-600 dark:text-slate-300">Перетягніть фото сюди або клікніть</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">Можна вибрати багато файлів одразу</p>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => upload(e.target.files)} />
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400 dark:text-slate-500">Завантаження…</p>
      ) : !photos.length ? (
        <p className="text-sm text-gray-400 dark:text-slate-500">Ще немає фото в альбомі</p>
      ) : (
        <>
          <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">Фото в альбомі: {photos.length}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((p, idx) => (
              <div key={p.id} className="premium-glass rounded-2xl p-2 space-y-2">
                <div className="relative group">
                  <img src={versions[p.id] ? `${p.image}?v=${versions[p.id]}` : p.image} alt="" className="w-full aspect-square object-cover rounded-xl bg-gray-100 dark:bg-slate-800" />
                  {rotate.isPending && rotate.variables?.id === p.id && (
                    <div className="absolute inset-0 grid place-items-center bg-black/40 rounded-xl"><Loader2 className="animate-spin text-white" size={22} /></div>
                  )}
                </div>
                <input
                  defaultValue={p.title}
                  onBlur={e => { if (e.target.value !== p.title) saveTitle.mutate({ id: p.id, title: e.target.value }); }}
                  placeholder="Підпис…"
                  className="w-full bg-transparent outline-none text-xs text-gray-700 dark:text-slate-300 border-b border-transparent focus:border-blue-400 py-0.5"
                />
                <div className="flex items-center justify-between gap-1">
                  <div className="flex gap-0.5">
                    <button type="button" onClick={() => rotate.mutate({ id: p.id, dir: 'ccw' })} title="Повернути проти годинникової" className="w-7 h-7 grid place-items-center rounded-lg bg-white/60 dark:bg-slate-800/60 text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"><RotateCcw size={14} /></button>
                    <button type="button" onClick={() => rotate.mutate({ id: p.id, dir: 'cw' })} title="Повернути за годинниковою" className="w-7 h-7 grid place-items-center rounded-lg bg-white/60 dark:bg-slate-800/60 text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"><RotateCw size={14} /></button>
                  </div>
                  <div className="flex gap-0.5">
                    <button type="button" onClick={() => move(idx, 'up')} disabled={idx === 0} title="Вгору" className="w-7 h-7 grid place-items-center rounded-lg bg-white/60 dark:bg-slate-800/60 text-gray-500 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"><ChevronUp size={14} /></button>
                    <button type="button" onClick={() => move(idx, 'down')} disabled={idx === photos.length - 1} title="Вниз" className="w-7 h-7 grid place-items-center rounded-lg bg-white/60 dark:bg-slate-800/60 text-gray-500 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"><ChevronDown size={14} /></button>
                    <button type="button" onClick={() => { if (window.confirm('Видалити фото?')) remove.mutate(p.id); }} title="Видалити" className="w-7 h-7 grid place-items-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
