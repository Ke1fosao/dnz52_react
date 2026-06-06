import { useState } from 'react';
import {
  adminParentsAnnouncementsApi, adminParentsDocumentsApi, adminParentsAdaptationApi,
  adminParentsEnrollmentApi, adminParentsSamplesApi,
} from '../lib/adminApi';
import { FlatCrudManager, type FlatField } from '../components/FlatCrudManager';
import { cn } from '@/lib/utils';

const ACCENTS = [
  { value: 'primary', label: 'Синій' }, { value: 'success', label: 'Зелений' },
  { value: 'warning', label: 'Помаранчевий' }, { value: 'danger', label: 'Червоний' },
  { value: 'info', label: 'Бірюзовий' }, { value: 'secondary', label: 'Сірий' },
];
const LINK_TYPES = [
  { value: 'external', label: 'Зовнішнє посилання (URL)' },
  { value: 'page', label: 'Внутрішня сторінка (slug)' },
  { value: 'file', label: 'Файл для завантаження' },
];

type ManagerCfg = { key: string; label: string; api: typeof adminParentsAnnouncementsApi; fields: FlatField[]; titleKey?: string; subtitleKey?: string; addLabel: string; emptyText: string };

const TABS: ManagerCfg[] = [
  {
    key: 'announce', label: 'Оголошення', api: adminParentsAnnouncementsApi, addLabel: 'Додати оголошення',
    emptyText: 'Ще немає оголошень', titleKey: 'title',
    fields: [
      { key: 'image', label: 'Зображення', type: 'image', required: true },
      { key: 'title', label: 'Підпис (необов\'язково)', type: 'text' },
      { key: 'link', label: 'Посилання (за бажанням)', type: 'url', hint: 'Якщо вказано — банер буде клікабельним' },
      { key: 'is_active', label: 'Активне (показується)', type: 'toggle' },
    ],
  },
  {
    key: 'docs', label: 'Документи', api: adminParentsDocumentsApi, addLabel: 'Додати документ',
    emptyText: 'Ще немає документів', titleKey: 'title', subtitleKey: 'description',
    fields: [
      { key: 'title', label: 'Назва', type: 'text', required: true, full: true },
      { key: 'description', label: 'Короткий опис', type: 'text', full: true },
      { key: 'link_type', label: 'Тип посилання', type: 'select', options: LINK_TYPES },
      { key: 'accent', label: 'Колір акценту', type: 'select', options: ACCENTS },
      { key: 'icon', label: 'Іконка', type: 'icon', full: true },
      { key: 'external_url', label: 'Зовнішня URL (для типу «Зовнішнє»)', type: 'url', full: true },
      { key: 'internal_slug', label: 'Slug сторінки (для типу «Внутрішня»)', type: 'text' },
      { key: 'file', label: 'Файл (для типу «Файл»)', type: 'file' },
      { key: 'is_active', label: 'Активний', type: 'toggle' },
    ],
  },
  {
    key: 'adaptation', label: 'Фото адаптації', api: adminParentsAdaptationApi, addLabel: 'Додати фото',
    emptyText: 'Ще немає фото', titleKey: 'title',
    fields: [
      { key: 'image', label: 'Фото', type: 'image', required: true },
      { key: 'title', label: 'Підпис (необов\'язково)', type: 'text' },
      { key: 'is_active', label: 'Активне', type: 'toggle' },
    ],
  },
  {
    key: 'enrollment', label: 'Документи для зарахування', api: adminParentsEnrollmentApi, addLabel: 'Додати документ',
    emptyText: 'Ще немає документів', titleKey: 'title', subtitleKey: 'note',
    fields: [
      { key: 'title', label: 'Назва документа', type: 'text', required: true, full: true },
      { key: 'note', label: 'Примітка', type: 'text', full: true },
      { key: 'is_active', label: 'Активний', type: 'toggle' },
    ],
  },
  {
    key: 'samples', label: 'Зразки заяв', api: adminParentsSamplesApi, addLabel: 'Додати зразок',
    emptyText: 'Ще немає зразків', titleKey: 'title', subtitleKey: 'caption',
    fields: [
      { key: 'image', label: 'Фото зразка', type: 'image', required: true },
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'caption', label: 'Підпис під фото', type: 'text', full: true },
      { key: 'is_active', label: 'Активний', type: 'toggle' },
    ],
  },
];

export function ParentsPage() {
  const [tab, setTab] = useState(0);
  const t = TABS[tab];
  return (
    <div className="space-y-5 animate-page-fade-in">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Батькам</h1>
        <p className="text-gray-500 dark:text-slate-400 font-medium">Контент сторінки для батьків</p>
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
      <FlatCrudManager key={t.key} qKey={`parents-${t.key}`} api={t.api} fields={t.fields} addLabel={t.addLabel} titleKey={t.titleKey} subtitleKey={t.subtitleKey} emptyText={t.emptyText} />
    </div>
  );
}
