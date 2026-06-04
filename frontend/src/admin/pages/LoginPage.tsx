import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { LogIn, Loader2, ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '../lib/adminAuth';

export function LoginPage() {
  const { user, login } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) navigate('/manage', { replace: true }); }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(username.trim(), password);
      navigate('/manage', { replace: true });
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || 'Не вдалося увійти. Перевірте логін і пароль.');
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 dark:text-white';

  return (
    <div className="mesh-bg-gallery min-h-screen grid place-items-center p-4">
      <Toaster position="top-center" richColors />
      <form onSubmit={submit} className="premium-glass rounded-[2rem] p-8 md:p-10 w-full max-w-md animate-scale-in">
        <div className="w-16 h-16 mx-auto rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-cyan-500 text-white grid place-items-center mb-5 shadow-lg shadow-blue-500/30">
          <ShieldCheck size={30} />
        </div>
        <h1 className="text-2xl font-black text-center mb-1 text-gray-900 dark:text-white">Адмінпанель ЗДО №52</h1>
        <p className="text-center text-gray-500 dark:text-slate-400 mb-6 text-sm">Вхід за вашим Django-логіном</p>

        <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-slate-300">Логін</label>
        <input value={username} onChange={e => setUsername(e.target.value)} autoFocus autoComplete="username" className={`${field} mb-4`} />

        <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-slate-300">Пароль</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" className={`${field} mb-6`} />

        <button type="submit" disabled={busy || !username || !password}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors">
          {busy ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />} Увійти
        </button>
      </form>
    </div>
  );
}
