import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminGalleryAlbumsApi, adminMetaApi, adminGalleryCategoriesApi } from '../lib/adminApi';
import { Field, inputCls, ImageField, Toggle, FormHeader, FormActions } from '../components/FormControls';
import { InlineCreateSelect } from '../components/InlineCreate';
import { AlbumPhotos } from '../components/AlbumPhotos';

export function AlbumFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: meta } = useQuery({ queryKey: ['admin-meta'], queryFn: adminMetaApi.get });
  const { data: existing } = useQuery({ queryKey: ['admin-gallery-albums', id], queryFn: () => adminGalleryAlbumsApi.get(id!), enabled: editing });

  const [form, setForm] = useState({ title: '', slug: '', category: '', description: '', is_published: true });
  const [cover, setCover] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({ title: existing.title, slug: existing.slug, category: existing.category?.toString() || '', description: existing.description || '', is_published: existing.is_published });
      setCoverUrl(existing.cover);
    }
  }, [existing]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }) as typeof form);

  const save = async () => {
    if (!form.title.trim()) { toast.error('Вкажіть назву альбому'); return; }
    if (!editing && !cover) { toast.error('Виберіть обкладинку'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      if (form.slug) fd.append('slug', form.slug);
      if (form.category) fd.append('category', form.category);
      fd.append('description', form.description);
      fd.append('is_published', String(form.is_published));
      if (cover) fd.append('cover', cover);
      if (editing) {
        await adminGalleryAlbumsApi.update(id!, fd);
        qc.invalidateQueries({ queryKey: ['admin-gallery-albums'] });
        toast.success('Збережено');
        nav('/manage/albums');
      } else {
        const created = await adminGalleryAlbumsApi.create(fd);
        qc.invalidateQueries({ queryKey: ['admin-gallery-albums'] });
        toast.success('Альбом створено — тепер додайте фото');
        nav(`/manage/albums/${created.id}/edit`);
      }
    } catch { toast.error('Не вдалося зберегти'); } finally { setSaving(false); }
  };

  const del = async () => {
    if (!window.confirm('Видалити альбом з усіма фото?')) return;
    try { await adminGalleryAlbumsApi.remove(id!); qc.invalidateQueries({ queryKey: ['admin-gallery-albums'] }); toast.success('Видалено'); nav('/manage/albums'); } catch { toast.error('Помилка'); }
  };

  return (
    <div className="animate-page-fade-in max-w-3xl">
      <FormHeader title={editing ? 'Редагувати альбом' : 'Новий альбом'} backTo="/manage/albums" />
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <Field label="Назва альбому" required><input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} /></Field>
        {editing && <Field label="URL (slug)"><input className={`${inputCls} font-mono text-sm`} value={form.slug} onChange={e => set('slug', e.target.value)} /></Field>}
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Категорія">
            <InlineCreateSelect value={form.category} onChange={v => set('category', v)} options={meta?.gallery_categories || []} placeholder="— Без категорії (блок «Інше») —" createApi={adminGalleryCategoriesApi} />
          </Field>
          <Field label="Обкладинка" required={!editing}><ImageField url={coverUrl} file={cover} onPick={setCover} /></Field>
        </div>
        <Field label="Опис"><textarea className={inputCls} rows={3} value={form.description} onChange={e => set('description', e.target.value)} /></Field>
        <Toggle checked={form.is_published} onChange={v => set('is_published', v)} label="Опубліковано (показується на сайті)" />

        {editing ? (
          <div className="pt-2 border-t border-white/40 dark:border-white/10">
            <p className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-3">Фотографії альбому</p>
            <AlbumPhotos albumId={Number(id)} />
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-slate-500 pt-2 border-t border-white/40 dark:border-white/10">Фото можна завантажити після збереження альбому.</p>
        )}

        <FormActions onSave={save} saving={saving} onDelete={editing ? del : undefined} cancelTo="/manage/albums" />
      </div>
    </div>
  );
}
