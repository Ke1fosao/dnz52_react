import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { adminSpecialistPagesApi } from '../lib/adminApi';
import { ListSkeleton } from '../components/AdminUI';

const PAGE_TYPES = [
  { value: 'methodical', label: 'Методична робота' },
  { value: 'physical', label: 'Фізкультурно-оздоровча' },
  { value: 'music', label: 'Музичний керівник' },
  { value: 'psychologist', label: 'Психолог' },
  { value: 'medical', label: 'Медична сестра' },
];

export function SpecialistsListPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-specialist-pages'], queryFn: adminSpecialistPagesApi.list });

  const create = useMutation({
    mutationFn: (pt: { value: string; label: string }) => adminSpecialistPagesApi.create({ page_type: pt.value, title: pt.label }),
    onSuccess: (page) => { qc.invalidateQueries({ queryKey: ['admin-specialist-pages'] }); toast.success('Сторінку створено'); nav(`/manage/specialists/${page.id}/edit`); },
    onError: () => toast.error('Помилка'),
  });

  return (
    <div className="space-y-5 animate-page-fade-in">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Спеціалісти</h1>
        <p className="text-gray-500 dark:text-slate-400 font-medium">Сторінки розділів (методист, психолог, музкерівник тощо)</p>
      </div>

      {isLoading ? <ListSkeleton /> : (
        <div className="grid sm:grid-cols-2 gap-3">
          {PAGE_TYPES.map(pt => {
            const page = data?.find(p => p.page_type === pt.value);
            return (
              <div key={pt.value} className="premium-glass rounded-[1.5rem] p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-400 text-white grid place-items-center shrink-0"><UserCog size={22} /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-gray-900 dark:text-white truncate">{page?.title || pt.label}</h3>
                  {page ? (
                    <p className="text-xs text-gray-400 dark:text-slate-500">👤 {page.specialists_count} спец. · 📂 {page.sections_count} розділів</p>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-slate-500">Сторінку ще не створено</p>
                  )}
                </div>
                {page ? (
                  <button onClick={() => nav(`/manage/specialists/${page.id}/edit`)} className="inline-flex items-center gap-1.5 bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 font-bold text-sm px-3.5 py-2 rounded-xl transition-colors shrink-0"><Pencil size={15} /> Редагувати</button>
                ) : (
                  <button onClick={() => create.mutate(pt)} disabled={create.isPending} className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-3.5 py-2 rounded-xl transition-colors shrink-0"><Plus size={15} /> Створити</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
