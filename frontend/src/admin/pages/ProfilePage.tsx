import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { ShieldCheck, ShieldOff, KeyRound, Loader2, Save, Smartphone, UserCog } from 'lucide-react';
import { adminProfileApi, admin2faApi } from '../lib/adminApi';
import { useAdminAuth } from '../lib/adminAuth';
import { Field, inputCls } from '../components/FormControls';

const errMsg = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || fallback;

export function ProfilePage() {
  const { refresh } = useAdminAuth();
  const { data, refetch } = useQuery({ queryKey: ['admin-profile'], queryFn: adminProfileApi.get });

  const [form, setForm] = useState({ username: '', first_name: '', last_name: '', email: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [pw, setPw] = useState({ old_password: '', new_password: '' });
  const [savingPw, setSavingPw] = useState(false);

  const [configUrl, setConfigUrl] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [busy2fa, setBusy2fa] = useState(false);
  const [disablePw, setDisablePw] = useState('');
  const [disabling, setDisabling] = useState(false);

  useEffect(() => {
    if (data) setForm({ username: data.username, first_name: data.first_name || '', last_name: data.last_name || '', email: data.email || '' });
  }, [data]);
  useEffect(() => {
    if (configUrl) QRCode.toDataURL(configUrl, { width: 220, margin: 1 }).then(setQr).catch(() => setQr(null));
  }, [configUrl]);

  const secret = configUrl ? new URLSearchParams(configUrl.split('?')[1] || '').get('secret') : null;

  const saveProfile = async () => {
    if (!form.username.trim()) { toast.error('Вкажіть логін'); return; }
    setSavingProfile(true);
    try { await adminProfileApi.update(form); toast.success('Профіль збережено'); refetch(); refresh(); }
    catch (e) { toast.error(errMsg(e, 'Не вдалося зберегти')); } finally { setSavingProfile(false); }
  };

  const changePassword = async () => {
    if (pw.new_password.length < 6) { toast.error('Новий пароль — мінімум 6 символів'); return; }
    setSavingPw(true);
    try { await adminProfileApi.changePassword(pw.old_password, pw.new_password); toast.success('Пароль змінено'); setPw({ old_password: '', new_password: '' }); }
    catch (e) { toast.error(errMsg(e, 'Помилка')); } finally { setSavingPw(false); }
  };

  const startSetup = async () => {
    setBusy2fa(true);
    try { const r = await admin2faApi.setup(); setConfigUrl(r.config_url); setOtp(''); }
    catch (e) { toast.error(errMsg(e, 'Помилка')); } finally { setBusy2fa(false); }
  };
  const confirm2fa = async () => {
    setBusy2fa(true);
    try {
      await admin2faApi.confirm(otp.trim());
      toast.success('Двофакторну автентифікацію увімкнено 🔐');
      setConfigUrl(null); setQr(null); setOtp('');
      refetch(); refresh();
    } catch (e) { toast.error(errMsg(e, 'Невірний код')); } finally { setBusy2fa(false); }
  };
  const disable2fa = async () => {
    if (!disablePw) { toast.error('Введіть поточний пароль'); return; }
    setDisabling(true);
    try { await admin2faApi.disable(disablePw); toast.success('2FA вимкнено'); setDisablePw(''); refetch(); refresh(); }
    catch (e) { toast.error(errMsg(e, 'Помилка')); } finally { setDisabling(false); }
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="animate-page-fade-in max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white grid place-items-center shrink-0"><UserCog size={24} /></span>
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Мій профіль</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Особисті дані, пароль і безпека</p>
        </div>
      </div>

      {/* Профіль */}
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <h2 className="font-black text-lg text-gray-900 dark:text-white">Особисті дані</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Логін"><input className={`${inputCls} font-mono`} value={form.username} onChange={e => set('username', e.target.value)} /></Field>
          <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} /></Field>
          <Field label="Ім'я"><input className={inputCls} value={form.first_name} onChange={e => set('first_name', e.target.value)} /></Field>
          <Field label="Прізвище"><input className={inputCls} value={form.last_name} onChange={e => set('last_name', e.target.value)} /></Field>
        </div>
        <button onClick={saveProfile} disabled={savingProfile} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
          {savingProfile ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Зберегти
        </button>
      </div>

      {/* Пароль */}
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <h2 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2"><KeyRound size={20} className="text-blue-500" /> Зміна пароля</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Поточний пароль"><input type="password" className={inputCls} value={pw.old_password} onChange={e => setPw(p => ({ ...p, old_password: e.target.value }))} autoComplete="current-password" /></Field>
          <Field label="Новий пароль" hint="Мінімум 6 символів"><input type="password" className={inputCls} value={pw.new_password} onChange={e => setPw(p => ({ ...p, new_password: e.target.value }))} autoComplete="new-password" /></Field>
        </div>
        <button onClick={changePassword} disabled={savingPw || !pw.old_password || !pw.new_password} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
          {savingPw ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />} Змінити пароль
        </button>
      </div>

      {/* 2FA */}
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-4">
        <h2 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2"><ShieldCheck size={20} className="text-emerald-500" /> Двофакторна автентифікація</h2>

        {data?.has_2fa ? (
          <>
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400"><ShieldCheck size={18} /> Увімкнено — при вході запитується код із застосунку.</div>
            <p className="text-sm text-gray-500 dark:text-slate-400">Щоб вимкнути, підтвердьте поточним паролем:</p>
            <div className="flex gap-2 flex-wrap">
              <input type="password" className={`${inputCls} flex-1 min-w-[180px]`} value={disablePw} onChange={e => setDisablePw(e.target.value)} placeholder="Поточний пароль" autoComplete="current-password" />
              <button onClick={disable2fa} disabled={disabling} className="inline-flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold px-4 py-2.5 rounded-xl transition-colors">
                {disabling ? <Loader2 className="animate-spin" size={18} /> : <ShieldOff size={18} />} Вимкнути 2FA
              </button>
            </div>
          </>
        ) : configUrl ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-slate-300">1. Відскануйте QR-код у застосунку (Google Authenticator, Authy тощо):</p>
            <div className="flex flex-wrap items-center gap-4">
              {qr ? <img src={qr} alt="QR" className="w-44 h-44 rounded-2xl bg-white p-2 shrink-0" /> : <div className="w-44 h-44 rounded-2xl bg-gray-100 dark:bg-slate-800 grid place-items-center"><Loader2 className="animate-spin text-gray-400" /></div>}
              {secret && (
                <div className="text-sm text-gray-500 dark:text-slate-400">
                  <p className="mb-1">або введіть ключ вручну:</p>
                  <code className="px-3 py-1.5 rounded-lg bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 font-mono text-xs break-all">{secret}</code>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300">2. Введіть 6-значний код із застосунку:</p>
            <div className="flex gap-2 flex-wrap">
              <input value={otp} onChange={e => setOtp(e.target.value)} inputMode="numeric" placeholder="000000" className={`${inputCls} max-w-[160px] text-center font-mono tracking-[0.3em]`} />
              <button onClick={confirm2fa} disabled={busy2fa || otp.trim().length < 6} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-xl transition-colors">
                {busy2fa ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />} Підтвердити
              </button>
              <button onClick={() => { setConfigUrl(null); setQr(null); setOtp(''); }} className="font-bold px-4 py-2.5 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">Скасувати</button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-2"><Smartphone size={16} /> Додатковий захист: при вході, окрім пароля, треба буде ввести код із застосунку-автентифікатора.</p>
            <button onClick={startSetup} disabled={busy2fa} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
              {busy2fa ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />} Увімкнути 2FA
            </button>
          </>
        )}
      </div>
    </div>
  );
}
