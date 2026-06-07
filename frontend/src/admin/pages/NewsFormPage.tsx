import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminNewsApi, adminMetaApi, adminNewsCategoriesApi, adminNewsTagsApi } from '../lib/adminApi';
import { Field, inputCls, MarkdownEditor, ImageField, FormHeader, FormActions } from '../components/FormControls';
import { InlineCreateSelect, InlineCreateTags } from '../components/InlineCreate';

export function NewsFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: meta } = useQuery({ queryKey: ['admin-meta'], queryFn: adminMetaApi.get });
  const { data: existing } = useQuery({ queryKey: ['admin-news', id], queryFn: () => adminNewsApi.get(id!), enabled: editing });

  const [form, setForm] = useState({ title: '', slug: '', category: '', tags: [] as number[], content: '', status: 'draft', publish_at: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title, slug: existing.slug, category: existing.category?.toString() || '',
        tags: existing.tags || [], content: existing.content || '', status: existing.status,
        publish_at: existing.publish_at ? existing.publish_at.slice(0, 16) : '',
      });
      setImageUrl(existing.image);
    }
  }, [existing]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }) as typeof form);

  const save = async () => {
    if (!form.title.trim()) { toast.error('Вкажіть заголовок'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      if (form.slug) fd.append('slug', form.slug);
      if (form.category) fd.append('category', form.category);
      form.tags.forEach(t => fd.append('tags', String(t)));
      fd.append('content', form.content);
      fd.append('status', form.status);
      if (form.status === 'scheduled' && form.publish_at) fd.append('publish_at', new Date(form.publish_at).toISOString());
      if (imageFile) fd.append('image', imageFile);
      if (editing) await adminNewsApi.update(id!, fd); else await adminNewsApi.create(fd);
      qc.invalidateQueries({ queryKey: ['admin-news'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(editing ? 'Збережено' : 'Новину створено');
      nav('/manage/news');
    } catch {
      toast.error('Не вдалося зберегти');
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!window.confirm('Видалити новину?')) return;
    try {
      await adminNewsApi.remove(id!);
      qc.invalidateQueries({ queryKey: ['admin-news'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Видалено');
      nav('/manage/news');
    } catch { toast.error('Помилка'); }
  };

  return (
    <div className="animate-page-fade-in max-w-3xl">
      <FormHeader title={editing ? 'Редагувати новину' : 'Нова новина'} backTo="/manage/news" />
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <Field label="Заголовок" required>
          <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Назва новини" />
        </Field>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Категорія">
            <InlineCreateSelect value={form.category} onChange={v => set('category', v)} options={meta?.news_categories || []} placeholder="— без категорії —" createApi={adminNewsCategoriesApi} />
          </Field>
          <Field label="Статус">
            <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
              {(meta?.news_statuses ?? []).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
        </div>

        {form.status === 'scheduled' && (
          <Field label="Опублікувати о" hint="Дата і час автоматичної появи на сайті">
            <input type="datetime-local" className={inputCls} value={form.publish_at} onChange={e => set('publish_at', e.target.value)} />
          </Field>
        )}

        <Field label="Теги">
          <InlineCreateTags all={meta?.news_tags || []} selected={form.tags} onChange={v => set('tags', v)} createApi={adminNewsTagsApi} />
        </Field>

        <Field label="Зображення">
          <ImageField url={imageUrl} file={imageFile} onPick={setImageFile} />
        </Field>

        <Field label="Текст новини">
          <MarkdownEditor value={form.content} onChange={v => set('content', v)} rows={12} aiKind="news" />
        </Field>

        <FormActions onSave={save} saving={saving} onDelete={editing ? del : undefined} cancelTo="/manage/news" />
      </div>
    </div>
  );
}
