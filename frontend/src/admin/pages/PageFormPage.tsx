import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminPagesApi } from '../lib/adminApi';
import { Field, inputCls, ImageField, MarkdownEditor, Toggle, FormHeader, FormActions } from '../components/FormControls';
import { InlineImages } from '../components/InlineImages';

export function PageFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: existing } = useQuery({ queryKey: ['admin-pages', id], queryFn: () => adminPagesApi.get(id!), enabled: editing });
  const [form, setForm] = useState({ title: '', slug: '', content: '', is_published: true, order: '0' });
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({ title: existing.title, slug: existing.slug, content: existing.content || '', is_published: existing.is_published, order: String(existing.order) });
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
      fd.append('content', form.content);
      fd.append('is_published', String(form.is_published));
      fd.append('order', String(Number(form.order) || 0));
      if (image) fd.append('image', image);
      if (editing) {
        await adminPagesApi.update(id!, fd);
        qc.invalidateQueries({ queryKey: ['admin-pages'] });
        toast.success('Збережено');
        nav('/manage/pages');
      } else {
        const created = await adminPagesApi.create(fd);
        qc.invalidateQueries({ queryKey: ['admin-pages'] });
        toast.success('Сторінку створено — тепер можна додати фото');
        nav(`/manage/pages/${created.id}/edit`);
      }
    } catch { toast.error('Не вдалося зберегти'); } finally { setSaving(false); }
  };

  const del = async () => {
    if (!window.confirm('Видалити сторінку?')) return;
    try { await adminPagesApi.remove(id!); qc.invalidateQueries({ queryKey: ['admin-pages'] }); toast.success('Видалено'); nav('/manage/pages'); } catch { toast.error('Помилка'); }
  };

  return (
    <div className="animate-page-fade-in max-w-3xl">
      <FormHeader title={editing ? 'Редагувати сторінку' : 'Нова сторінка'} backTo="/manage/pages" />
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <Field label="Заголовок" required><input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} /></Field>
        {editing && (
          <Field label="URL (slug)" hint="Адреса сторінки: /page/<slug>">
            <input className={`${inputCls} font-mono text-sm`} value={form.slug} onChange={e => set('slug', e.target.value)} />
          </Field>
        )}
        <Field label="Обкладинка"><ImageField url={imageUrl} file={image} onPick={setImage} /></Field>
        <Field label="Контент"><MarkdownEditor value={form.content} onChange={v => set('content', v)} rows={12} aiKind="page" /></Field>
        <div className="grid sm:grid-cols-2 gap-5 items-end">
          <Field label="Порядок"><input type="number" className={inputCls} value={form.order} onChange={e => set('order', e.target.value)} /></Field>
          <Toggle checked={form.is_published} onChange={v => set('is_published', v)} label="Опубліковано" />
        </div>

        {editing ? (
          <div className="pt-2 border-t border-white/40 dark:border-white/10">
            <p className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-3">Фотогалерея сторінки</p>
            <InlineImages pageId={Number(id)} />
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-slate-500 pt-2 border-t border-white/40 dark:border-white/10">
            Фотогалерею можна буде додати після збереження сторінки.
          </p>
        )}

        <FormActions onSave={save} saving={saving} onDelete={editing ? del : undefined} cancelTo="/manage/pages" />
      </div>
    </div>
  );
}
