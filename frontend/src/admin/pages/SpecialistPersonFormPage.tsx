import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminSpecialistPeopleApi, adminSpecialistAlbumsApi, adminMetaApi } from '../lib/adminApi';
import { Field, inputCls, ImageField, MarkdownEditor, FormHeader, FormActions } from '../components/FormControls';
import { FlatCrudManager, type FlatField } from '../components/FlatCrudManager';

export function SpecialistPersonFormPage() {
  const { pageId, personId } = useParams();
  const editing = !!personId;
  const nav = useNavigate();
  const qc = useQueryClient();
  const backTo = `/manage/specialists/${pageId}/edit`;

  const { data: meta } = useQuery({ queryKey: ['admin-meta'], queryFn: adminMetaApi.get });
  const { data: existing } = useQuery({ queryKey: ['admin-specialist-person', personId], queryFn: () => adminSpecialistPeopleApi.get(personId!), enabled: editing });

  const [form, setForm] = useState({ full_name: '', position: '', experience: '', category: '', birth_date: '', education: '', motto: '', bio: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        full_name: existing.full_name || '', position: existing.position || '', experience: existing.experience || '',
        category: existing.category || '', birth_date: existing.birth_date || '', education: existing.education || '',
        motto: existing.motto || '', bio: existing.bio || '',
      });
      setPhotoUrl(existing.photo);
    }
  }, [existing]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }) as typeof form);

  const save = async () => {
    if (!form.full_name.trim()) { toast.error('Вкажіть ПІБ'); return; }
    if (!form.position.trim()) { toast.error('Вкажіть посаду'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      if (!editing) fd.append('page', String(pageId));
      (['full_name', 'position', 'experience', 'category', 'education', 'motto', 'bio'] as const).forEach(k => fd.append(k, form[k]));
      if (form.birth_date) fd.append('birth_date', form.birth_date);
      if (photo) fd.append('photo', photo);
      if (editing) {
        await adminSpecialistPeopleApi.update(personId!, fd);
        toast.success('Збережено');
        nav(backTo);
      } else {
        const created = await adminSpecialistPeopleApi.create(fd);
        toast.success('Спеціаліста створено — можна додати альбоми');
        nav(`/manage/specialists/${pageId}/people/${created.id}`);
      }
    } catch { toast.error('Не вдалося зберегти'); } finally { setSaving(false); }
  };

  const del = async () => {
    if (!window.confirm('Видалити спеціаліста?')) return;
    try { await adminSpecialistPeopleApi.remove(personId!); qc.invalidateQueries({ queryKey: ['admin-childnav', `spec-people-${pageId}`] }); toast.success('Видалено'); nav(backTo); } catch { toast.error('Помилка'); }
  };

  const ALBUM_FIELDS: FlatField[] = [
    { key: 'album', label: 'Альбом галереї', type: 'select', required: true, options: (meta?.gallery_albums || []).map(a => ({ value: String(a.id), label: a.name })) },
    { key: 'description', label: 'Опис заходу', type: 'textarea', full: true },
  ];

  return (
    <div className="animate-page-fade-in max-w-3xl">
      <FormHeader title={editing ? 'Редагувати спеціаліста' : 'Новий спеціаліст'} backTo={backTo} />
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <Field label="Фото"><ImageField url={photoUrl} file={photo} onPick={setPhoto} /></Field>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="ПІБ" required><input className={inputCls} value={form.full_name} onChange={e => set('full_name', e.target.value)} /></Field>
          <Field label="Посада" required><input className={inputCls} value={form.position} onChange={e => set('position', e.target.value)} /></Field>
          <Field label="Педагогічний стаж"><input className={inputCls} value={form.experience} onChange={e => set('experience', e.target.value)} /></Field>
          <Field label="Кваліфікаційна категорія"><input className={inputCls} value={form.category} onChange={e => set('category', e.target.value)} /></Field>
          <Field label="Дата народження"><input type="date" className={inputCls} value={form.birth_date} onChange={e => set('birth_date', e.target.value)} /></Field>
          <Field label="Життєве кредо / девіз"><input className={inputCls} value={form.motto} onChange={e => set('motto', e.target.value)} /></Field>
        </div>
        <Field label="Освіта"><textarea className={`${inputCls} resize-y`} rows={2} value={form.education} onChange={e => set('education', e.target.value)} /></Field>
        <Field label="Біографія / опис діяльності" hint="Markdown"><MarkdownEditor value={form.bio} onChange={v => set('bio', v)} rows={6} aiKind="bio" /></Field>

        {editing ? (
          <div className="pt-2 border-t border-white/40 dark:border-white/10">
            <p className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-3">Фотоальбоми спеціаліста</p>
            <FlatCrudManager
              qKey={`spec-albums-${personId}`}
              api={{ list: () => adminSpecialistAlbumsApi.listFor(Number(personId)), create: adminSpecialistAlbumsApi.create, update: adminSpecialistAlbumsApi.update, remove: adminSpecialistAlbumsApi.remove }}
              fields={ALBUM_FIELDS} addLabel="Додати альбом" titleKey="album_title" subtitleKey="description"
              extra={{ specialist: Number(personId) }} emptyText="Ще немає прив'язаних альбомів"
            />
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-slate-500 pt-2 border-t border-white/40 dark:border-white/10">Альбоми можна додати після збереження.</p>
        )}

        <FormActions onSave={save} saving={saving} onDelete={editing ? del : undefined} cancelTo={backTo} />
      </div>
    </div>
  );
}
