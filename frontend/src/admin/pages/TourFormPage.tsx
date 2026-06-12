import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminTourApi } from '../lib/adminApi';
import { Field, inputCls, ImageField, Toggle, FormHeader, FormActions } from '../components/FormControls';

export function TourFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: existing } = useQuery({ queryKey: ['admin-tour', id], queryFn: () => adminTourApi.get(id!), enabled: editing });
  const [form, setForm] = useState({ title: '', description: '', order: '0', is_published: true });
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({ title: existing.title, description: existing.description || '', order: String(existing.order), is_published: existing.is_published });
      setImageUrl(existing.image);
    }
  }, [existing]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }) as typeof form);

  const save = async () => {
    if (!form.title.trim()) { toast.error('Вкажіть назву зупинки'); return; }
    if (!editing && !image) { toast.error('Виберіть фото'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('order', String(Number(form.order) || 0));
      fd.append('is_published', String(form.is_published));
      if (image) fd.append('image', image);
      if (editing) await adminTourApi.update(id!, fd); else await adminTourApi.create(fd);
      qc.invalidateQueries({ queryKey: ['admin-tour'] });
      toast.success(editing ? 'Збережено' : 'Зупинку додано');
      nav('/manage/tour');
    } catch (err: any) { 
        console.error(err);
        const msg = err.response?.data?.detail || err.response?.data?.trace || 'Не вдалося зберегти';
        toast.error(msg); 
    } finally { setSaving(false); }
  };

  const del = async () => {
    if (!window.confirm('Видалити зупинку?')) return;
    try {
      await adminTourApi.remove(id!);
      qc.invalidateQueries({ queryKey: ['admin-tour'] });
      toast.success('Видалено');
      nav('/manage/tour');
    } catch { toast.error('Помилка'); }
  };

  return (
    <div className="animate-page-fade-in max-w-3xl">
      <FormHeader title={editing ? 'Редагувати зупинку' : 'Нова зупинка туру'} backTo="/manage/tour" />
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <Field label="Назва зупинки" required><input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="напр. Музична зала" /></Field>
        <Field label="Опис" hint="Короткий розповідний опис локації"><textarea className={inputCls} rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Розкажіть про цю локацію…" /></Field>
        <Field label="Фото" required={!editing}><ImageField url={imageUrl} file={image} onPick={setImage} /></Field>
        <Field label="Порядок"><input type="number" className={inputCls} value={form.order} onChange={e => set('order', e.target.value)} /></Field>
        <Toggle checked={form.is_published} onChange={v => set('is_published', v)} label="Опубліковано (показується на сайті)" />
        <FormActions onSave={save} saving={saving} onDelete={editing ? del : undefined} cancelTo="/manage/tour" />
      </div>
    </div>
  );
}
