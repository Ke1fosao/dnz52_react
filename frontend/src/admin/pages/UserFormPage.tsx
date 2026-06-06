import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { adminUsersApi } from '../lib/adminApi';
import { useAdminAuth } from '../lib/adminAuth';
import { Field, inputCls, Toggle, FormHeader, FormActions } from '../components/FormControls';
import { formatDate } from '@/lib/utils';

export function UserFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user: me } = useAdminAuth();

  const { data: existing } = useQuery({ queryKey: ['admin-users', id], queryFn: () => adminUsersApi.get(id!), enabled: editing });
  const [form, setForm] = useState({ username: '', first_name: '', last_name: '', email: '', is_staff: true, is_superuser: false, is_active: true });
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const isMe = editing && me?.username === existing?.username;

  useEffect(() => {
    if (existing) setForm({
      username: existing.username, first_name: existing.first_name || '', last_name: existing.last_name || '',
      email: existing.email || '', is_staff: existing.is_staff, is_superuser: existing.is_superuser, is_active: existing.is_active,
    });
  }, [existing]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }) as typeof form);
  const err = (e: unknown, fallback: string) => toast.error((e as { response?: { data?: { detail?: string; username?: string[] } } }).response?.data?.detail || (e as { response?: { data?: { username?: string[] } } }).response?.data?.username?.[0] || fallback);

  const save = async () => {
    if (!form.username.trim()) { toast.error('Вкажіть логін'); return; }
    if (!editing && password.length < 6) { toast.error('Пароль має містити щонайменше 6 символів'); return; }
    setSaving(true);
    try {
      if (editing) {
        await adminUsersApi.update(id!, form);
        toast.success('Збережено');
      } else {
        await adminUsersApi.create({ ...form, password });
        toast.success('Користувача створено');
      }
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      nav('/manage/users');
    } catch (e) { err(e, 'Не вдалося зберегти'); } finally { setSaving(false); }
  };

  const del = async () => {
    if (!window.confirm('Видалити користувача?')) return;
    try { await adminUsersApi.remove(id!); qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Видалено'); nav('/manage/users'); }
    catch (e) { err(e, 'Помилка'); }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) { toast.error('Пароль має містити щонайменше 6 символів'); return; }
    try { await adminUsersApi.setPassword(Number(id), newPassword); toast.success('Пароль змінено'); setNewPassword(''); }
    catch (e) { err(e, 'Помилка'); }
  };

  return (
    <div className="animate-page-fade-in max-w-2xl">
      <FormHeader title={editing ? 'Редагувати користувача' : 'Новий користувач'} backTo="/manage/users" />
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Логін" required><input className={`${inputCls} font-mono`} value={form.username} onChange={e => set('username', e.target.value)} autoComplete="off" /></Field>
          {!editing && <Field label="Пароль" required hint="Мінімум 6 символів"><input type="text" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" /></Field>}
          <Field label="Ім'я"><input className={inputCls} value={form.first_name} onChange={e => set('first_name', e.target.value)} /></Field>
          <Field label="Прізвище"><input className={inputCls} value={form.last_name} onChange={e => set('last_name', e.target.value)} /></Field>
        </div>
        <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} /></Field>

        <div className="space-y-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500">Права доступу</p>
          <Toggle checked={form.is_staff} onChange={v => set('is_staff', v)} label="Доступ до адмінпанелі (персонал)" />
          <Toggle checked={form.is_superuser} onChange={v => set('is_superuser', v)} label="Суперкористувач (повний доступ + керування акаунтами)" />
          <Toggle checked={form.is_active} onChange={v => set('is_active', v)} label="Активний акаунт" />
          {isMe && <p className="text-xs text-amber-600 dark:text-amber-400">⚠️ Це ваш акаунт — не можна зняти власні права чи деактивувати себе.</p>}
        </div>

        {editing && (
          <div className="space-y-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500">Зміна пароля</p>
            <div className="flex gap-2 flex-wrap">
              <input type="text" className={`${inputCls} flex-1 min-w-[180px]`} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Новий пароль (мін. 6 символів)" autoComplete="new-password" />
              <button type="button" onClick={changePassword} className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-700/70 border border-white/60 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 font-bold text-sm px-4 py-2.5 rounded-xl text-gray-700 dark:text-slate-200 transition-colors"><KeyRound size={16} /> Змінити пароль</button>
            </div>
            {existing && <p className="text-xs text-gray-400 dark:text-slate-500">Останній вхід: {existing.last_login ? formatDate(existing.last_login) : 'ніколи'} · Зареєстровано: {formatDate(existing.date_joined)}</p>}
          </div>
        )}

        <FormActions onSave={save} saving={saving} onDelete={editing && !isMe ? del : undefined} cancelTo="/manage/users" />
      </div>
    </div>
  );
}
