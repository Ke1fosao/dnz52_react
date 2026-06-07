import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminSpecialistSectionsApi, adminSpecialistSectionPhotosApi, adminMetaApi } from '../lib/adminApi';
import { Field, inputCls, IconPicker, MarkdownEditor, Toggle, FormHeader, FormActions } from '../components/FormControls';
import { ChildImageManager } from '../components/ChildImageManager';

const ACCENTS = [
  { value: 'primary', label: 'Синій' }, { value: 'success', label: 'Зелений' },
  { value: 'warning', label: 'Помаранчевий' }, { value: 'danger', label: 'Червоний' },
  { value: 'info', label: 'Бірюзовий' }, { value: 'purple', label: 'Фіолетовий' },
  { value: 'pink', label: 'Рожевий' },
];
const KINDS = [
  { value: 'info', label: 'Інформаційна (з інлайн-фото)' },
  { value: 'event', label: 'Подія (посилання на альбом / новину)' },
];

export function SpecialistSectionFormPage() {
  const { pageId, sectionId } = useParams();
  const editing = !!sectionId;
  const nav = useNavigate();
  const qc = useQueryClient();
  const backTo = `/manage/specialists/${pageId}/edit`;

  const { data: meta } = useQuery({ queryKey: ['admin-meta'], queryFn: adminMetaApi.get });
  const { data: existing } = useQuery({ queryKey: ['admin-specialist-section', sectionId], queryFn: () => adminSpecialistSectionsApi.get(sectionId!), enabled: editing });

  const [form, setForm] = useState({ title: '', subtitle: '', description: '', icon: 'bi-lightning-fill', accent: 'primary', kind: 'info', link_album: '', link_news_slug: '', link_external_url: '', link_label: 'Переглянути фотоальбом', is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) setForm({
      title: existing.title || '', subtitle: existing.subtitle || '', description: existing.description || '',
      icon: existing.icon || 'bi-lightning-fill', accent: existing.accent || 'primary', kind: existing.kind || 'info',
      link_album: existing.link_album?.toString() || '', link_news_slug: existing.link_news_slug || '',
      link_external_url: existing.link_external_url || '', link_label: existing.link_label || '', is_active: existing.is_active,
    });
  }, [existing]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }) as typeof form);

  const save = async () => {
    if (!form.title.trim()) { toast.error('Вкажіть заголовок розділу'); return; }
    setSaving(true);
    const payload: Record<string, unknown> = {
      title: form.title, subtitle: form.subtitle, description: form.description, icon: form.icon,
      accent: form.accent, kind: form.kind, link_news_slug: form.link_news_slug,
      link_external_url: form.link_external_url, link_label: form.link_label, is_active: form.is_active,
      link_album: form.link_album ? Number(form.link_album) : null,
    };
    if (!editing) payload.page = Number(pageId);
    try {
      if (editing) {
        await adminSpecialistSectionsApi.update(sectionId!, payload);
        toast.success('Збережено');
        nav(backTo);
      } else {
        const created = await adminSpecialistSectionsApi.create(payload);
        toast.success('Розділ створено — можна додати фото');
        nav(`/manage/specialists/${pageId}/sections/${created.id}`);
      }
    } catch { toast.error('Не вдалося зберегти'); } finally { setSaving(false); }
  };

  const del = async () => {
    if (!window.confirm('Видалити розділ?')) return;
    try { await adminSpecialistSectionsApi.remove(sectionId!); qc.invalidateQueries({ queryKey: ['admin-childnav', `spec-sections-${pageId}`] }); toast.success('Видалено'); nav(backTo); } catch { toast.error('Помилка'); }
  };

  return (
    <div className="animate-page-fade-in max-w-3xl">
      <FormHeader title={editing ? 'Редагувати розділ' : 'Новий розділ'} backTo={backTo} />
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <Field label="Заголовок розділу" required><input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} /></Field>
        <Field label="Підзаголовок"><input className={inputCls} value={form.subtitle} onChange={e => set('subtitle', e.target.value)} /></Field>
        <Field label="Опис розділу" hint="Markdown"><MarkdownEditor value={form.description} onChange={v => set('description', v)} rows={5} aiKind="section" /></Field>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Іконка"><IconPicker value={form.icon} onChange={v => set('icon', v)} /></Field>
          <Field label="Колір акценту">
            <select className={inputCls} value={form.accent} onChange={e => set('accent', e.target.value)}>{ACCENTS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}</select>
          </Field>
          <Field label="Тип розділу">
            <select className={inputCls} value={form.kind} onChange={e => set('kind', e.target.value)}>{KINDS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}</select>
          </Field>
          <Field label="Текст кнопки-посилання"><input className={inputCls} value={form.link_label} onChange={e => set('link_label', e.target.value)} /></Field>
        </div>

        <div className="rounded-2xl bg-white/40 dark:bg-slate-800/40 p-4 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500">Посилання (для типу «Подія») — заповніть лише одне</p>
          <Field label="Альбом у галереї">
            <select className={inputCls} value={form.link_album} onChange={e => set('link_album', e.target.value)}>
              <option value="">— немає —</option>
              {meta?.gallery_albums.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Slug новини"><input className={inputCls} value={form.link_news_slug} onChange={e => set('link_news_slug', e.target.value)} placeholder="svyato-oseni" /></Field>
            <Field label="Зовнішнє посилання"><input className={inputCls} value={form.link_external_url} onChange={e => set('link_external_url', e.target.value)} placeholder="https://…" /></Field>
          </div>
        </div>

        <Toggle checked={form.is_active} onChange={v => set('is_active', v)} label="Активний (показується на сайті)" />

        {editing ? (
          <div className="pt-2 border-t border-white/40 dark:border-white/10">
            <p className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Фото розділу</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Показуються для розділів типу «Інформаційна».</p>
            <ChildImageManager parentId={Number(sectionId)} parentKey="section" api={adminSpecialistSectionPhotosApi} qKey="spec-section-photos" />
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-slate-500 pt-2 border-t border-white/40 dark:border-white/10">Фото можна додати після збереження.</p>
        )}

        <FormActions onSave={save} saving={saving} onDelete={editing ? del : undefined} cancelTo={backTo} />
      </div>
    </div>
  );
}
