import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminCirclesApi, adminCircleBenefitsApi, adminCircleSessionsApi, adminMetaApi } from '../lib/adminApi';
import { Field, inputCls, ImageField, ColorField, IconPicker, MarkdownEditor, Toggle, FormHeader, FormActions } from '../components/FormControls';
import { InlineRepeater, type InlineFieldDef } from '../components/InlineRepeater';

const BENEFIT_FIELDS: InlineFieldDef[] = [
  { key: 'icon', label: 'Іконка', type: 'icon' },
  { key: 'title', label: 'Що розвиває', type: 'text' },
  { key: 'text', label: 'Пояснення', type: 'text', col: 'sm:col-span-2' },
];
const SESSION_FIELDS: InlineFieldDef[] = [
  { key: 'day', label: 'День', type: 'text' },
  { key: 'time', label: 'Час', type: 'text' },
  { key: 'note', label: 'Група / примітка', type: 'text', col: 'sm:col-span-2' },
];

export function CircleFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: meta } = useQuery({ queryKey: ['admin-meta'], queryFn: adminMetaApi.get });
  const { data: existing } = useQuery({ queryKey: ['admin-circles', id], queryFn: () => adminCirclesApi.get(id!), enabled: editing });

  const [form, setForm] = useState({
    name: '', slug: '', tagline: '', leader: '', age_group: '', schedule: '', duration: '',
    format: '', price: '', icon: 'bi-star', color: '#4A90E2', goal: '', description: '',
    album: '', is_featured: false, order: '0', is_published: true,
  });
  const [cover, setCover] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name, slug: existing.slug, tagline: existing.tagline || '', leader: existing.leader || '',
        age_group: existing.age_group || '', schedule: existing.schedule || '', duration: existing.duration || '',
        format: existing.format || '', price: existing.price || '', icon: existing.icon || 'bi-star',
        color: existing.color || '#4A90E2', goal: existing.goal || '', description: existing.description || '',
        album: existing.album?.toString() || '', is_featured: existing.is_featured, order: String(existing.order), is_published: existing.is_published,
      });
      setCoverUrl(existing.cover);
    }
  }, [existing]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }) as typeof form);

  const save = async () => {
    if (!form.name.trim() || !form.leader.trim()) { toast.error('Вкажіть назву і керівника'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      const text: (keyof typeof form)[] = ['name', 'tagline', 'leader', 'age_group', 'schedule', 'duration', 'format', 'price', 'icon', 'color', 'goal', 'description'];
      text.forEach(k => fd.append(k, String(form[k])));
      if (form.slug) fd.append('slug', form.slug);
      if (form.album) fd.append('album', form.album);
      fd.append('is_featured', String(form.is_featured));
      fd.append('is_published', String(form.is_published));
      fd.append('order', String(Number(form.order) || 0));
      if (cover) fd.append('cover', cover);
      if (editing) {
        await adminCirclesApi.update(id!, fd);
        qc.invalidateQueries({ queryKey: ['admin-circles'] });
        toast.success('Збережено');
        nav('/manage/circles');
      } else {
        const created = await adminCirclesApi.create(fd);
        qc.invalidateQueries({ queryKey: ['admin-circles'] });
        toast.success('Гурток створено — тепер можна додати переваги й розклад');
        nav(`/manage/circles/${created.id}/edit`);
      }
    } catch { toast.error('Не вдалося зберегти'); } finally { setSaving(false); }
  };

  const del = async () => {
    if (!window.confirm('Видалити гурток?')) return;
    try { await adminCirclesApi.remove(id!); qc.invalidateQueries({ queryKey: ['admin-circles'] }); toast.success('Видалено'); nav('/manage/circles'); } catch { toast.error('Помилка'); }
  };

  return (
    <div className="animate-page-fade-in max-w-3xl">
      <FormHeader title={editing ? 'Редагувати гурток' : 'Новий гурток'} backTo="/manage/circles" />
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Назва" required><input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} /></Field>
          <Field label="Керівник" required><input className={inputCls} value={form.leader} onChange={e => set('leader', e.target.value)} /></Field>
        </div>
        {editing && <Field label="URL (slug)"><input className={`${inputCls} font-mono text-sm`} value={form.slug} onChange={e => set('slug', e.target.value)} /></Field>}
        <Field label="Слоган" hint="Одне речення для картки"><input className={inputCls} value={form.tagline} onChange={e => set('tagline', e.target.value)} /></Field>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Іконка"><IconPicker value={form.icon} onChange={v => set('icon', v)} /></Field>
          <Field label="Колір"><ColorField value={form.color} onChange={v => set('color', v)} /></Field>
        </div>
        <Field label="Обкладинка (необов'язково)"><ImageField url={coverUrl} file={cover} onPick={setCover} /></Field>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Вікова група"><input className={inputCls} value={form.age_group} onChange={e => set('age_group', e.target.value)} placeholder="напр. 4–6 років" /></Field>
          <Field label="Розклад (коротко)"><input className={inputCls} value={form.schedule} onChange={e => set('schedule', e.target.value)} /></Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <Field label="Тривалість"><input className={inputCls} value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="25–35 хв" /></Field>
          <Field label="Формат"><input className={inputCls} value={form.format} onChange={e => set('format', e.target.value)} /></Field>
          <Field label="Вартість"><input className={inputCls} value={form.price} onChange={e => set('price', e.target.value)} /></Field>
        </div>
        <Field label="Мета та завдання"><MarkdownEditor value={form.goal} onChange={v => set('goal', v)} rows={5} /></Field>
        <Field label="Опис діяльності"><MarkdownEditor value={form.description} onChange={v => set('description', v)} rows={6} /></Field>
        <div className="grid sm:grid-cols-2 gap-5 items-end">
          <Field label="Фотоальбом">
            <select className={inputCls} value={form.album} onChange={e => set('album', e.target.value)}>
              <option value="">— без альбому —</option>
              {meta?.gallery_albums.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="Порядок"><input type="number" className={inputCls} value={form.order} onChange={e => set('order', e.target.value)} /></Field>
        </div>
        <div className="flex flex-wrap gap-5">
          <Toggle checked={form.is_featured} onChange={v => set('is_featured', v)} label="Рекомендований (виділити)" />
          <Toggle checked={form.is_published} onChange={v => set('is_published', v)} label="Опубліковано" />
        </div>

        {editing ? (
          <div className="space-y-5 pt-2 border-t border-white/40 dark:border-white/10">
            <div>
              <p className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-3">Що розвиває (переваги)</p>
              <InlineRepeater parentId={Number(id)} parentKey="circle" api={adminCircleBenefitsApi} fields={BENEFIT_FIELDS} addLabel="Додати перевагу" defaults={{ icon: 'bi-check-circle' }} qKey="circle-benefits" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-3">Розклад занять</p>
              <InlineRepeater parentId={Number(id)} parentKey="circle" api={adminCircleSessionsApi} fields={SESSION_FIELDS} addLabel="Додати заняття" qKey="circle-sessions" />
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-slate-500 pt-2 border-t border-white/40 dark:border-white/10">Переваги й розклад можна додати після збереження гуртка.</p>
        )}

        <FormActions onSave={save} saving={saving} onDelete={editing ? del : undefined} cancelTo="/manage/circles" />
      </div>
    </div>
  );
}
