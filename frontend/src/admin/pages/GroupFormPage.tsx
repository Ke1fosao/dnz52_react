import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminGroupsApi, adminGroupStaffApi, adminMetaApi } from '../lib/adminApi';
import { Field, inputCls, ImageField, ColorField, Toggle, FormHeader, FormActions } from '../components/FormControls';
import { InlineRepeater, type InlineFieldDef } from '../components/InlineRepeater';

const STAFF_FIELDS: InlineFieldDef[] = [
  { key: 'role', label: 'Посада', type: 'select', options: [{ value: 'teacher', label: 'Вихователь' }, { value: 'assistant', label: 'Помічник вихователя' }] },
  { key: 'full_name', label: 'ПІБ', type: 'text' },
  { key: 'photo', label: 'Фото', type: 'image' },
  { key: 'experience', label: 'Стаж', type: 'text' },
  { key: 'birth_date', label: 'Дата народження', type: 'date' },
  { key: 'education', label: 'Освіта', type: 'textarea', col: 'sm:col-span-2' },
  { key: 'motto', label: 'Життєве кредо', type: 'text', col: 'sm:col-span-2' },
];

export function GroupFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: meta } = useQuery({ queryKey: ['admin-meta'], queryFn: adminMetaApi.get });
  const { data: existing } = useQuery({ queryKey: ['admin-groups', id], queryFn: () => adminGroupsApi.get(id!), enabled: editing });

  const [form, setForm] = useState({ name: '', slug: '', age_group: '', color: '#4A90E2', motto: '', description: '', album: '', order: '0', is_published: true });
  const [cover, setCover] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({ name: existing.name, slug: existing.slug, age_group: existing.age_group || '', color: existing.color || '#4A90E2', motto: existing.motto || '', description: existing.description || '', album: existing.album?.toString() || '', order: String(existing.order), is_published: existing.is_published });
      setCoverUrl(existing.cover);
    }
  }, [existing]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }) as typeof form);

  const save = async () => {
    if (!form.name.trim()) { toast.error('Вкажіть назву групи'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      if (form.slug) fd.append('slug', form.slug);
      fd.append('age_group', form.age_group);
      fd.append('color', form.color);
      fd.append('motto', form.motto);
      fd.append('description', form.description);
      if (form.album) fd.append('album', form.album);
      fd.append('order', String(Number(form.order) || 0));
      fd.append('is_published', String(form.is_published));
      if (cover) fd.append('cover', cover);
      if (editing) {
        await adminGroupsApi.update(id!, fd);
        qc.invalidateQueries({ queryKey: ['admin-groups'] });
        toast.success('Збережено');
        nav('/manage/groups');
      } else {
        const created = await adminGroupsApi.create(fd);
        qc.invalidateQueries({ queryKey: ['admin-groups'] });
        toast.success('Групу створено — тепер можна додати персонал');
        nav(`/manage/groups/${created.id}/edit`);
      }
    } catch { toast.error('Не вдалося зберегти'); } finally { setSaving(false); }
  };

  const del = async () => {
    if (!window.confirm('Видалити групу?')) return;
    try { await adminGroupsApi.remove(id!); qc.invalidateQueries({ queryKey: ['admin-groups'] }); toast.success('Видалено'); nav('/manage/groups'); } catch { toast.error('Помилка'); }
  };

  return (
    <div className="animate-page-fade-in max-w-3xl">
      <FormHeader title={editing ? 'Редагувати групу' : 'Нова група'} backTo="/manage/groups" />
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <Field label="Назва" required><input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} /></Field>
        {editing && <Field label="URL (slug)"><input className={`${inputCls} font-mono text-sm`} value={form.slug} onChange={e => set('slug', e.target.value)} /></Field>}
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Вікова категорія">
            <select className={inputCls} value={form.age_group} onChange={e => set('age_group', e.target.value)}>
              <option value="">— не вказано —</option>
              {meta?.age_groups.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </Field>
          <Field label="Колір групи"><ColorField value={form.color} onChange={v => set('color', v)} /></Field>
        </div>
        <Field label="Девіз"><input className={inputCls} value={form.motto} onChange={e => set('motto', e.target.value)} /></Field>
        <Field label="Обкладинка"><ImageField url={coverUrl} file={cover} onPick={setCover} /></Field>
        <Field label="Опис"><textarea className={inputCls} rows={4} value={form.description} onChange={e => set('description', e.target.value)} /></Field>
        <div className="grid sm:grid-cols-2 gap-5 items-end">
          <Field label="Фотоальбом">
            <select className={inputCls} value={form.album} onChange={e => set('album', e.target.value)}>
              <option value="">— без альбому —</option>
              {meta?.gallery_albums.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="Порядок"><input type="number" className={inputCls} value={form.order} onChange={e => set('order', e.target.value)} /></Field>
        </div>
        <Toggle checked={form.is_published} onChange={v => set('is_published', v)} label="Опубліковано" />

        {editing ? (
          <div className="pt-2 border-t border-white/40 dark:border-white/10">
            <p className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-3">Персонал групи (вихователі та помічники)</p>
            <InlineRepeater parentId={Number(id)} parentKey="group" api={adminGroupStaffApi} fields={STAFF_FIELDS} addLabel="Додати працівника" defaults={{ role: 'teacher' }} qKey="group-staff" />
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-slate-500 pt-2 border-t border-white/40 dark:border-white/10">Персонал можна додати після збереження групи.</p>
        )}

        <FormActions onSave={save} saving={saving} onDelete={editing ? del : undefined} cancelTo="/manage/groups" />
      </div>
    </div>
  );
}
