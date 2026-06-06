import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminContactApi } from '../lib/adminApi';
import { Field, inputCls } from '../components/FormControls';

export function ContactFormPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-contact'], queryFn: adminContactApi.get });
  const [form, setForm] = useState({
    address: '', phone: '', email: '', working_hours: '', map_embed: '',
    facebook_url: '', instagram_url: '', youtube_url: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm({
      address: data.address || '', phone: data.phone || '', email: data.email || '',
      working_hours: data.working_hours || '', map_embed: data.map_embed || '',
      facebook_url: data.facebook_url || '', instagram_url: data.instagram_url || '', youtube_url: data.youtube_url || '',
    });
  }, [data]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }) as typeof form);

  const save = async () => {
    setSaving(true);
    try {
      await adminContactApi.update(form);
      qc.invalidateQueries({ queryKey: ['admin-contact'] });
      toast.success('Збережено');
    } catch { toast.error('Не вдалося зберегти'); }
    finally { setSaving(false); }
  };

  return (
    <div className="animate-page-fade-in max-w-3xl space-y-5">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Контакти</h1>
        <p className="text-gray-500 dark:text-slate-400 font-medium">Контактна інформація закладу (показується на сайті)</p>
      </div>
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <Field label="Адреса" required>
          <input className={inputCls} value={form.address} onChange={e => set('address', e.target.value)} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Телефон" hint="Декілька — через кому">
            <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} />
          </Field>
          <Field label="Email">
            <input className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} />
          </Field>
        </div>
        <Field label="Режим роботи" hint="Кожен запис з нового рядка">
          <textarea className={inputCls} rows={3} value={form.working_hours} onChange={e => set('working_hours', e.target.value)} />
        </Field>
        <Field label="Код карти Google Maps" hint="iframe-код (Google Maps → Поділитися → Вбудувати карту). Порожньо = авто-пошук за адресою.">
          <textarea className={`${inputCls} font-mono text-xs`} rows={3} value={form.map_embed} onChange={e => set('map_embed', e.target.value)} />
        </Field>
        <div className="grid sm:grid-cols-3 gap-5">
          <Field label="Facebook"><input className={inputCls} value={form.facebook_url} onChange={e => set('facebook_url', e.target.value)} placeholder="https://…" /></Field>
          <Field label="Instagram"><input className={inputCls} value={form.instagram_url} onChange={e => set('instagram_url', e.target.value)} placeholder="https://…" /></Field>
          <Field label="YouTube"><input className={inputCls} value={form.youtube_url} onChange={e => set('youtube_url', e.target.value)} placeholder="https://…" /></Field>
        </div>
        <div className="flex">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Зберегти
          </button>
        </div>
      </div>
    </div>
  );
}
