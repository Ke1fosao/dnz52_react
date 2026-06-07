import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  adminAttestationSettingsApi, adminAttestationDocumentsApi, adminAttestationStepsApi,
  adminAttestationCategoriesApi, adminAttestationLawsApi,
} from '../lib/adminApi';
import { FlatCrudManager, type FlatField } from '../components/FlatCrudManager';
import { Field, inputCls, MarkdownEditor } from '../components/FormControls';
import { cn } from '@/lib/utils';

const ACCENTS = [
  { value: 'primary', label: 'Синій' }, { value: 'success', label: 'Зелений' },
  { value: 'warning', label: 'Помаранчевий' }, { value: 'info', label: 'Блакитний' },
  { value: 'purple', label: 'Фіолетовий' }, { value: 'danger', label: 'Червоний' },
];
const CAT_COLORS = [
  { value: 'cat-1', label: '🟢 Зелений (Спеціаліст)' },
  { value: 'cat-2', label: '🔵 Блакитний (II категорія)' },
  { value: 'cat-3', label: '🔷 Синій (I категорія)' },
  { value: 'cat-4', label: '🟣 Фіолетовий (Вища)' },
];

const DOC_FIELDS: FlatField[] = [
  { key: 'title', label: 'Назва документа', type: 'text', required: true, full: true },
  { key: 'subtitle', label: 'Короткий опис', type: 'text', full: true },
  { key: 'category', label: 'Тип (мітка)', type: 'text', placeholder: 'Наказ, Графік, Список…' },
  { key: 'accent', label: 'Колір акценту', type: 'select', options: ACCENTS },
  { key: 'url', label: 'Посилання на документ', type: 'url', required: true, full: true },
  { key: 'icon', label: 'Іконка', type: 'icon', full: true },
  { key: 'is_active', label: 'Активний', type: 'toggle' },
];
const STEP_FIELDS: FlatField[] = [
  { key: 'title', label: 'Назва етапу', type: 'text', required: true, full: true },
  { key: 'description', label: 'Пояснення', type: 'textarea' },
  { key: 'is_active', label: 'Активний', type: 'toggle' },
];
const CAT_FIELDS: FlatField[] = [
  { key: 'title', label: 'Назва категорії', type: 'text', required: true, full: true },
  { key: 'description', label: 'Опис / вимоги', type: 'textarea', required: true },
  { key: 'icon', label: 'Іконка', type: 'icon' },
  { key: 'color', label: 'Колір', type: 'select', options: CAT_COLORS },
  { key: 'is_active', label: 'Активний', type: 'toggle' },
];
const LAW_FIELDS: FlatField[] = [
  { key: 'title', label: 'Назва нормативного документа', type: 'text', required: true, full: true },
  { key: 'url', label: 'Посилання (необов\'язкове)', type: 'url', full: true },
  { key: 'is_active', label: 'Активний', type: 'toggle' },
];

const TABS = [
  { key: 'settings', label: 'Налаштування' },
  { key: 'docs', label: 'Документи' },
  { key: 'steps', label: 'Етапи' },
  { key: 'cats', label: 'Категорії' },
  { key: 'laws', label: 'Нормативна база' },
];

export function AttestationPage() {
  const [tab, setTab] = useState(0);
  const t = TABS[tab];
  return (
    <div className="space-y-5 animate-page-fade-in">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Атестація педагогів</h1>
        <p className="text-gray-500 dark:text-slate-400 font-medium">Сторінка «Атестація педагогічних працівників»</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((tb, i) => (
          <button key={tb.key} onClick={() => setTab(i)}
            className={cn('px-4 py-2 rounded-full text-sm font-bold transition-all',
              i === tab ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'premium-glass text-gray-600 dark:text-slate-300 hover:-translate-y-0.5')}>
            {tb.label}
          </button>
        ))}
      </div>
      {t.key === 'settings' && <SettingsForm />}
      {t.key === 'docs' && <FlatCrudManager key="att-docs" qKey="att-docs" api={adminAttestationDocumentsApi} fields={DOC_FIELDS} addLabel="Додати документ" titleKey="title" subtitleKey="subtitle" emptyText="Ще немає документів" />}
      {t.key === 'steps' && <FlatCrudManager key="att-steps" qKey="att-steps" api={adminAttestationStepsApi} fields={STEP_FIELDS} addLabel="Додати етап" titleKey="title" subtitleKey="description" emptyText="Ще немає етапів" />}
      {t.key === 'cats' && <FlatCrudManager key="att-cats" qKey="att-cats" api={adminAttestationCategoriesApi} fields={CAT_FIELDS} addLabel="Додати категорію" titleKey="title" subtitleKey="description" emptyText="Ще немає категорій" />}
      {t.key === 'laws' && <FlatCrudManager key="att-laws" qKey="att-laws" api={adminAttestationLawsApi} fields={LAW_FIELDS} addLabel="Додати документ" titleKey="title" emptyText="Ще немає документів" />}
    </div>
  );
}

function SettingsForm() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-attestation-settings'], queryFn: adminAttestationSettingsApi.get });
  const [form, setForm] = useState({ hero_lead: '', intro_html: '', docs_section_subtitle: '', contact_title: '', contact_html: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm({
      hero_lead: data.hero_lead || '', intro_html: data.intro_html || '',
      docs_section_subtitle: data.docs_section_subtitle || '', contact_title: data.contact_title || '',
      contact_html: data.contact_html || '',
    });
  }, [data]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }) as typeof form);

  const save = async () => {
    setSaving(true);
    try {
      const fresh = await adminAttestationSettingsApi.update(form);
      qc.setQueryData(['admin-attestation-settings'], fresh);
      toast.success('Налаштування збережено');
    } catch { toast.error('Не вдалося зберегти'); } finally { setSaving(false); }
  };

  return (
    <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
      <Field label="Підзаголовок під H1 (hero)"><textarea className={`${inputCls} resize-y`} rows={3} value={form.hero_lead} onChange={e => set('hero_lead', e.target.value)} /></Field>
      <Field label="Вступний блок (синій, ліворуч)" hint="Markdown / HTML"><MarkdownEditor value={form.intro_html} onChange={v => set('intro_html', v)} rows={6} aiKind="page" /></Field>
      <Field label="Підзаголовок секції документів"><input className={inputCls} value={form.docs_section_subtitle} onChange={e => set('docs_section_subtitle', e.target.value)} /></Field>
      <Field label="Заголовок підказки про контакти"><input className={inputCls} value={form.contact_title} onChange={e => set('contact_title', e.target.value)} /></Field>
      <Field label="Текст підказки про контакти (жовтий блок)" hint="Markdown / HTML"><MarkdownEditor value={form.contact_html} onChange={v => set('contact_html', v)} rows={5} aiKind="section" /></Field>
      <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Зберегти
      </button>
    </div>
  );
}
