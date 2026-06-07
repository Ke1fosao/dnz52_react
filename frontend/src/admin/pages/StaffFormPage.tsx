import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminStaffApi } from '../lib/adminApi';
import { Field, inputCls, ImageField, MarkdownEditor, Toggle, FormHeader, FormActions } from '../components/FormControls';

const ACCENTS = [
  { value: 'primary', label: 'Синій' }, { value: 'success', label: 'Зелений' },
  { value: 'warning', label: 'Помаранчевий' }, { value: 'danger', label: 'Червоний' },
  { value: 'info', label: 'Бірюзовий' }, { value: 'purple', label: 'Фіолетовий' },
];

export function StaffFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: existing } = useQuery({ queryKey: ['admin-staff', id], queryFn: () => adminStaffApi.get(id!), enabled: editing });
  const [form, setForm] = useState({
    full_name: '', position: '', education: '', experience: '', category: '', awards: '', bio: '',
    email: '', phone: '', reception_hours: '', detail_url: '', accent_color: 'primary',
    is_featured: false, is_active: true, order: '0',
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        full_name: existing.full_name, position: existing.position, education: existing.education || '',
        experience: existing.experience || '', category: existing.category || '', awards: existing.awards || '',
        bio: existing.bio || '', email: existing.email || '', phone: existing.phone || '',
        reception_hours: existing.reception_hours || '', detail_url: existing.detail_url || '',
        accent_color: existing.accent_color || 'primary', is_featured: existing.is_featured,
        is_active: existing.is_active, order: String(existing.order),
      });
      setPhotoUrl(existing.photo);
    }
  }, [existing]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }) as typeof form);

  const save = async () => {
    if (!form.full_name.trim() || !form.position.trim()) { toast.error('Вкажіть ПІБ і посаду'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      const fields: (keyof typeof form)[] = ['full_name', 'position', 'education', 'experience', 'category', 'awards', 'bio', 'email', 'phone', 'reception_hours', 'detail_url', 'accent_color'];
      fields.forEach(k => fd.append(k, String(form[k])));
      fd.append('is_featured', String(form.is_featured));
      fd.append('is_active', String(form.is_active));
      fd.append('order', String(Number(form.order) || 0));
      if (photo) fd.append('photo', photo);
      if (editing) await adminStaffApi.update(id!, fd); else await adminStaffApi.create(fd);
      qc.invalidateQueries({ queryKey: ['admin-staff'] });
      toast.success(editing ? 'Збережено' : 'Додано');
      nav('/manage/staff');
    } catch { toast.error('Не вдалося зберегти'); } finally { setSaving(false); }
  };

  const del = async () => {
    if (!window.confirm('Видалити цю особу?')) return;
    try { await adminStaffApi.remove(id!); qc.invalidateQueries({ queryKey: ['admin-staff'] }); toast.success('Видалено'); nav('/manage/staff'); } catch { toast.error('Помилка'); }
  };

  return (
    <div className="animate-page-fade-in max-w-3xl">
      <FormHeader title={editing ? 'Редагувати особу' : 'Нова особа'} backTo="/manage/staff" />
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="ПІБ" required><input className={inputCls} value={form.full_name} onChange={e => set('full_name', e.target.value)} /></Field>
          <Field label="Посада" required><input className={inputCls} value={form.position} onChange={e => set('position', e.target.value)} /></Field>
        </div>
        <Field label="Фото"><ImageField url={photoUrl} file={photo} onPick={setPhoto} /></Field>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Освіта"><input className={inputCls} value={form.education} onChange={e => set('education', e.target.value)} /></Field>
          <Field label="Стаж"><input className={inputCls} value={form.experience} onChange={e => set('experience', e.target.value)} /></Field>
        </div>
        <Field label="Категорія / звання"><input className={inputCls} value={form.category} onChange={e => set('category', e.target.value)} /></Field>
        <Field label="Нагороди" hint="Кожна — з нового рядка"><textarea className={inputCls} rows={2} value={form.awards} onChange={e => set('awards', e.target.value)} /></Field>
        <Field label="Біографія / опис"><MarkdownEditor value={form.bio} onChange={v => set('bio', v)} rows={6} aiKind="bio" /></Field>
        <div className="grid sm:grid-cols-3 gap-5">
          <Field label="Email"><input className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} /></Field>
          <Field label="Телефон"><input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
          <Field label="Години прийому"><input className={inputCls} value={form.reception_hours} onChange={e => set('reception_hours', e.target.value)} /></Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <Field label="Колір акценту">
            <select className={inputCls} value={form.accent_color} onChange={e => set('accent_color', e.target.value)}>
              {ACCENTS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </Field>
          <Field label="Повна сторінка (URL)" hint="напр. /specialists/psychologist/"><input className={inputCls} value={form.detail_url} onChange={e => set('detail_url', e.target.value)} /></Field>
          <Field label="Порядок"><input type="number" className={inputCls} value={form.order} onChange={e => set('order', e.target.value)} /></Field>
        </div>
        <div className="flex flex-wrap gap-5">
          <Toggle checked={form.is_featured} onChange={v => set('is_featured', v)} label="Головна особа (директор)" />
          <Toggle checked={form.is_active} onChange={v => set('is_active', v)} label="Активний" />
        </div>
        <FormActions onSave={save} saving={saving} onDelete={editing ? del : undefined} cancelTo="/manage/staff" />
      </div>
    </div>
  );
}
