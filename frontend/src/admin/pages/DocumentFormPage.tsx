import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminDocumentsApi, adminMetaApi, adminDocumentCategoriesApi } from '../lib/adminApi';
import { Field, inputCls, FileField, Toggle, FormHeader, FormActions } from '../components/FormControls';
import { InlineCreateSelect } from '../components/InlineCreate';

export function DocumentFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: meta } = useQuery({ queryKey: ['admin-meta'], queryFn: adminMetaApi.get });
  const { data: existing } = useQuery({ queryKey: ['admin-documents', id], queryFn: () => adminDocumentsApi.get(id!), enabled: editing });

  const [form, setForm] = useState({ title: '', category: '', description: '', is_published: true });
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({ title: existing.title, category: existing.category?.toString() || '', description: existing.description || '', is_published: existing.is_published });
      setFileUrl(existing.file);
    }
  }, [existing]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }) as typeof form);

  const save = async () => {
    if (!form.title.trim()) { toast.error('Вкажіть назву'); return; }
    if (!editing && !file) { toast.error('Виберіть файл'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      if (form.category) fd.append('category', form.category);
      fd.append('description', form.description);
      fd.append('is_published', String(form.is_published));
      if (file) fd.append('file', file);
      if (editing) await adminDocumentsApi.update(id!, fd); else await adminDocumentsApi.create(fd);
      qc.invalidateQueries({ queryKey: ['admin-documents'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(editing ? 'Збережено' : 'Документ додано');
      nav('/manage/documents');
    } catch {
      toast.error('Не вдалося зберегти');
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!window.confirm('Видалити документ?')) return;
    try {
      await adminDocumentsApi.remove(id!);
      qc.invalidateQueries({ queryKey: ['admin-documents'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Видалено');
      nav('/manage/documents');
    } catch { toast.error('Помилка'); }
  };

  return (
    <div className="animate-page-fade-in max-w-3xl">
      <FormHeader title={editing ? 'Редагувати документ' : 'Новий документ'} backTo="/manage/documents" />
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <Field label="Назва" required>
          <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Напр. Статут закладу" />
        </Field>
        <Field label="Категорія">
          <InlineCreateSelect value={form.category} onChange={v => set('category', v)} options={meta?.document_categories || []} placeholder="— без категорії —" createApi={adminDocumentCategoriesApi} />
        </Field>
        <Field label="Файл" required={!editing} hint="PDF, Word, Excel, зображення тощо">
          <FileField url={fileUrl} file={file} onPick={setFile} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png" />
        </Field>
        <Field label="Опис">
          <textarea className={inputCls} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Короткий опис документа (необов'язково)" />
        </Field>
        <Toggle checked={form.is_published} onChange={v => set('is_published', v)} label="Опубліковано (видно на сайті)" />
        <FormActions onSave={save} saving={saving} onDelete={editing ? del : undefined} cancelTo="/manage/documents" />
      </div>
    </div>
  );
}
