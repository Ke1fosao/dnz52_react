import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminEventsApi, adminMetaApi } from '../lib/adminApi';
import { Field, inputCls, MarkdownEditor, ImageField, Toggle, FormHeader, FormActions } from '../components/FormControls';

export function EventFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: meta } = useQuery({ queryKey: ['admin-meta'], queryFn: adminMetaApi.get });
  const { data: existing } = useQuery({ queryKey: ['admin-events', id], queryFn: () => adminEventsApi.get(id!), enabled: editing });

  const [form, setForm] = useState({
    title: '', slug: '', event_type: 'morning', start_date: '', end_date: '',
    location: '', group: '', description: '', is_published: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title, slug: existing.slug, event_type: existing.event_type,
        start_date: existing.start_date ? existing.start_date.slice(0, 16) : '',
        end_date: existing.end_date ? existing.end_date.slice(0, 16) : '',
        location: existing.location || '', group: existing.group?.toString() || '',
        description: existing.description || '', is_published: existing.is_published,
      });
      setImageUrl(existing.image);
    }
  }, [existing]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }) as typeof form);

  const save = async () => {
    if (!form.title.trim()) { toast.error('Вкажіть назву'); return; }
    if (!form.start_date) { toast.error('Вкажіть дату початку'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      if (form.slug) fd.append('slug', form.slug);
      fd.append('event_type', form.event_type);
      fd.append('start_date', new Date(form.start_date).toISOString());
      if (form.end_date) fd.append('end_date', new Date(form.end_date).toISOString());
      if (form.location) fd.append('location', form.location);
      if (form.group) fd.append('group', form.group);
      fd.append('description', form.description);
      fd.append('is_published', String(form.is_published));
      if (imageFile) fd.append('image', imageFile);
      if (editing) await adminEventsApi.update(id!, fd); else await adminEventsApi.create(fd);
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(editing ? 'Збережено' : 'Подію створено');
      nav('/manage/events');
    } catch {
      toast.error('Не вдалося зберегти');
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!window.confirm('Видалити подію?')) return;
    try {
      await adminEventsApi.remove(id!);
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Видалено');
      nav('/manage/events');
    } catch { toast.error('Помилка'); }
  };

  return (
    <div className="animate-page-fade-in max-w-3xl">
      <FormHeader title={editing ? 'Редагувати подію' : 'Нова подія'} backTo="/manage/events" />
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <Field label="Назва події" required>
          <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Напр. Випускний ранок" />
        </Field>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Тип події">
            <select className={inputCls} value={form.event_type} onChange={e => set('event_type', e.target.value)}>
              {(meta?.event_types ?? []).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Група (необов'язково)">
            <select className={inputCls} value={form.group} onChange={e => set('group', e.target.value)}>
              <option value="">— усі / без групи —</option>
              {meta?.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Початок" required>
            <input type="datetime-local" className={inputCls} value={form.start_date} onChange={e => set('start_date', e.target.value)} />
          </Field>
          <Field label="Закінчення (необов'язково)">
            <input type="datetime-local" className={inputCls} value={form.end_date} onChange={e => set('end_date', e.target.value)} />
          </Field>
        </div>

        <Field label="Місце проведення">
          <input className={inputCls} value={form.location} onChange={e => set('location', e.target.value)} placeholder="Напр. Музична зала" />
        </Field>

        <Field label="Зображення">
          <ImageField url={imageUrl} file={imageFile} onPick={setImageFile} />
        </Field>

        <Field label="Опис">
          <MarkdownEditor value={form.description} onChange={v => set('description', v)} rows={8} />
        </Field>

        <Toggle checked={form.is_published} onChange={v => set('is_published', v)} label="Опубліковано (видно на сайті)" />

        <FormActions onSave={save} saving={saving} onDelete={editing ? del : undefined} cancelTo="/manage/events" />
      </div>
    </div>
  );
}
