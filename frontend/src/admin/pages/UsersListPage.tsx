import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ShieldCheck, Shield, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { adminUsersApi } from '../lib/adminApi';
import { useAdminAuth } from '../lib/adminAuth';
import { ListSkeleton, EmptyBox, SearchInput } from '../components/AdminUI';

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || '?') + (parts[1]?.[0] || '');
}

export function UsersListPage() {
  const qc = useQueryClient();
  const { user: me } = useAdminAuth();
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: adminUsersApi.list });
  const remove = useMutation({
    mutationFn: adminUsersApi.remove,
    onSuccess: () => { toast.success('Користувача видалено'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Помилка'),
  });

  return (
    <div className="space-y-5 animate-page-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Користувачі</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Акаунти доступу до адмінпанелі</p>
        </div>
        <Link to="/manage/users/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"><Plus size={18} /> Додати користувача</Link>
      </div>

      {data && data.length > 6 && <SearchInput value={q} onChange={setQ} placeholder="Пошук за іменем або логіном…" />}

      {isLoading ? <ListSkeleton /> : !data?.length ? <EmptyBox text="Немає користувачів" /> : (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.filter(u => `${u.full_name} ${u.username} ${u.email}`.toLowerCase().includes(q.trim().toLowerCase())).map(u => {
            const isMe = me?.username === u.username;
            return (
              <div key={u.id} className="premium-glass rounded-[1.5rem] p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full grid place-items-center shrink-0 font-black text-white ${u.is_superuser ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'} ${!u.is_active && 'grayscale opacity-60'}`}>
                  {initials(u.full_name).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h3 className="font-black text-gray-900 dark:text-white truncate">{u.full_name}</h3>
                    {isMe && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 uppercase">ви</span>}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 truncate">@{u.username}{u.email && ` · ${u.email}`}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {u.is_superuser && <Badge color="amber" icon={ShieldCheck}>Суперкористувач</Badge>}
                    {u.is_staff && !u.is_superuser && <Badge color="blue" icon={Shield}>Персонал</Badge>}
                    {!u.is_active && <Badge color="gray" icon={UserX}>Деактивовано</Badge>}
                  </div>
                </div>
                <Link to={`/manage/users/${u.id}/edit`} className="w-9 h-9 grid place-items-center rounded-xl bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0" aria-label="Редагувати"><Pencil size={16} /></Link>
                {!isMe && (
                  <button onClick={() => { if (window.confirm(`Видалити користувача «${u.full_name}»?`)) remove.mutate(u.id); }} className="w-9 h-9 grid place-items-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors shrink-0" aria-label="Видалити"><Trash2 size={16} /></button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="text-xs text-gray-400 dark:text-slate-500">Останній вхід та дата реєстрації показані у формі редагування. Власний акаунт не можна деактивувати чи видалити.</p>
    </div>
  );
}

function Badge({ color, icon: Icon, children }: { color: 'amber' | 'blue' | 'gray'; icon: typeof Shield; children: ReactNode }) {
  const cls = {
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    gray: 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400',
  }[color];
  return <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${cls}`}><Icon size={11} /> {children}</span>;
}
