import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminSlidersApi } from '../lib/adminApi';
import { Field, inputCls, ImageField, FileField, Toggle, FormHeader, FormActions } from '../components/FormControls';

export function SliderFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: existing } = useQuery({ queryKey: ['admin-sliders', id], queryFn: () => adminSlidersApi.get(id!), enabled: editing });
  const [form, setForm] = useState({ title: '', description: '', link: '', order: '0', is_active: true });
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({ title: existing.title, description: existing.description || '', link: existing.link || '', order: String(existing.order), is_active: existing.is_active });
      setImageUrl(existing.image);
      setVideoUrl(existing.video);
    }
  }, [existing]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }) as typeof form);

  const save = async () => {
    if (!form.title.trim()) { toast.error('Вкажіть заголовок'); return; }
    if (!editing && !image) { toast.error('Виберіть зображення'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('link', form.link);
      fd.append('order', String(Number(form.order) || 0));
      fd.append('is_active', String(form.is_active));
      if (image) fd.append('image', image);
      if (video) fd.append('video', video);
      if (editing) await adminSlidersApi.update(id!, fd); else await adminSlidersApi.create(fd);
      qc.invalidateQueries({ queryKey: ['admin-sliders'] });
      toast.success(editing ? 'Збережено' : 'Слайд додано');
      nav('/manage/sliders');
    } catch { toast.error('Не вдалося зберегти'); } finally { setSaving(false); }
  };

  const del = async () => {
    if (!window.confirm('Видалити слайд?')) return;
    try { await adminSlidersApi.remove(id!); qc.invalidateQueries({ queryKey: ['admin-sliders'] }); toast.success('Видалено'); nav('/manage/sliders'); } catch { toast.error('Помилка'); }
  };

  return (
    <div className="animate-page-fade-in max-w-3xl">
      <FormHeader title={editing ? 'Редагувати слайд' : 'Новий слайд'} backTo="/manage/sliders" />
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <Field label="Заголовок" required><input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} /></Field>
        <Field label="Опис"><textarea className={inputCls} rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></Field>
        <Field label="Зображення" required={!editing}><ImageField url={imageUrl} file={image} onPick={setImage} /></Field>
        <Field label="Відео-фон (необов'язково)" hint="MP4/WebM — програється замість фото, фото стає постером">
          <FileField url={videoUrl} file={video} onPick={setVideo} accept="video/mp4,video/webm" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Посилання" hint="Куди веде клік (необов'язково)"><input className={inputCls} value={form.link} onChange={e => set('link', e.target.value)} placeholder="/news або https://…" /></Field>
          <Field label="Порядок"><input type="number" className={inputCls} value={form.order} onChange={e => set('order', e.target.value)} /></Field>
        </div>
        <Toggle checked={form.is_active} onChange={v => set('is_active', v)} label="Активний (показується на сайті)" />
        <FormActions onSave={save} saving={saving} onDelete={editing ? del : undefined} cancelTo="/manage/sliders" />
      </div>
    </div>
  );
}
