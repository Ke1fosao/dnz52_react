import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminFaqItemsApi, adminMetaApi } from '../lib/adminApi';
import { Field, inputCls, MarkdownEditor, Toggle, FormHeader, FormActions } from '../components/FormControls';

export function FaqItemFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: meta } = useQuery({ queryKey: ['admin-meta'], queryFn: adminMetaApi.get });
  const { data: existing } = useQuery({ queryKey: ['admin-faq-items', id], queryFn: () => adminFaqItemsApi.get(id!), enabled: editing });

  const [form, setForm] = useState({ question: '', answer: '', category: '', order: '0', is_published: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) setForm({
      question: existing.question, answer: existing.answer || '',
      category: existing.category?.toString() || '', order: String(existing.order),
      is_published: existing.is_published,
    });
  }, [existing]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }) as typeof form);

  const save = async () => {
    if (!form.question.trim()) { toast.error('Вкажіть питання'); return; }
    setSaving(true);
    try {
      const payload = {
        question: form.question, answer: form.answer,
        category: form.category ? Number(form.category) : null,
        order: Number(form.order) || 0, is_published: form.is_published,
      };
      if (editing) await adminFaqItemsApi.update(id!, payload); else await adminFaqItemsApi.create(payload);
      qc.invalidateQueries({ queryKey: ['admin-faq-items'] });
      toast.success(editing ? 'Збережено' : 'Створено');
      nav('/manage/faq');
    } catch {
      toast.error('Не вдалося зберегти');
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!window.confirm('Видалити це питання?')) return;
    try {
      await adminFaqItemsApi.remove(id!);
      qc.invalidateQueries({ queryKey: ['admin-faq-items'] });
      toast.success('Видалено');
      nav('/manage/faq');
    } catch { toast.error('Помилка'); }
  };

  return (
    <div className="animate-page-fade-in max-w-3xl">
      <FormHeader title={editing ? 'Редагувати питання' : 'Нове питання FAQ'} backTo="/manage/faq" />
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <Field label="Питання" required>
          <input className={inputCls} value={form.question} onChange={e => set('question', e.target.value)} placeholder="Напр. Які документи потрібні для вступу?" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Категорія">
            <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">— без категорії —</option>
              {meta?.faq_categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Порядок" hint="Менше число — вище у списку">
            <input type="number" className={inputCls} value={form.order} onChange={e => set('order', e.target.value)} />
          </Field>
        </div>
        <Field label="Відповідь">
          <MarkdownEditor value={form.answer} onChange={v => set('answer', v)} rows={8} />
        </Field>
        <Toggle checked={form.is_published} onChange={v => set('is_published', v)} label="Опубліковано (видно на сайті)" />
        <FormActions onSave={save} saving={saving} onDelete={editing ? del : undefined} cancelTo="/manage/faq" />
      </div>
    </div>
  );
}
