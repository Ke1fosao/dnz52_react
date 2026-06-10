import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminChatLogsApi } from '../lib/adminApi';
import { toast } from 'sonner';
import { LineChart, Sparkles, AlertCircle, Bot, Loader2, Calendar, History, ArrowUpDown } from 'lucide-react';
import { RichContent } from '@/components/common/RichContent';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export function ChatAnalyticsPage() {
  const [days, setDays] = useState<number>(7);
  const [hideAnswered, setHideAnswered] = useState<boolean>(true);
  
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: logs, isLoading: loadingLogs } = useQuery({
    queryKey: ['admin-chat-logs'],
    queryFn: adminChatLogsApi.list,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => adminChatLogsApi.analyze(days, hideAnswered),
    onSuccess: () => toast.success('Аналіз успішно завершено!'),
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Помилка при генерації звіту.'),
  });

  const sortedLogs = [...(logs || [])].sort((a, b) => {
    if (sortBy === 'status') {
      const valA = a.sources_found ? 1 : 0;
      const valB = b.sources_found ? 1 : 0;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    } else {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    }
  });

  const toggleSort = (field: 'date' | 'status') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="premium-glass rounded-3xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black mb-2 flex items-center gap-3">
              <span className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/20">
                <LineChart size={24} />
              </span>
              Аналітика запитів до ШІ
            </h1>
            <p className="text-gray-500 dark:text-slate-400 font-medium">
              Дізнайтеся, що найчастіше шукають батьки, і якої інформації не вистачає на сайті.
            </p>
          </div>
        </div>

        <div className="bg-white/40 dark:bg-slate-800/40 rounded-2xl p-6 border border-white/50 dark:border-slate-700/50 mb-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-3">
              <label className="text-sm font-bold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                <Calendar size={16} /> Період для аналізу
              </label>
              <select
                className="w-full bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                value={days}
                onChange={e => setDays(Number(e.target.value))}
              >
                <option value={1}>Останні 24 години</option>
                <option value={7}>Останні 7 днів</option>
                <option value={14}>Останні 14 днів</option>
                <option value={30}>Останній місяць</option>
                <option value={90}>Останні 3 місяці</option>
              </select>
            </div>

            <div className="flex-1 space-y-3">
              <label className="text-sm font-bold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                <AlertCircle size={16} /> Фільтрація
              </label>
              <label className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 cursor-pointer select-none group hover:border-purple-300 transition-colors">
                <input
                  type="checkbox"
                  checked={hideAnswered}
                  onChange={e => setHideAnswered(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-600 focus:ring-offset-0 transition-all cursor-pointer"
                />
                <span className="font-medium text-gray-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                  Приховати питання, на які вже є відповіді
                </span>
              </label>
            </div>
          </div>

          <button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {analyzeMutation.isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Sparkles size={20} />
            )}
            {analyzeMutation.isPending ? 'Аналізуємо...' : 'Згенерувати звіт від ШІ'}
          </button>
        </div>

        {analyzeMutation.data && (
          <div className="bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl p-6 md:p-8 border border-purple-100 dark:border-purple-900/50 shadow-xl shadow-purple-500/5 mb-10">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-200/50 dark:border-slate-700">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 grid place-items-center">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="font-black text-lg text-gray-900 dark:text-white">Звіт від ШІ-аналітика</h3>
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400">Сгенеровано автоматично</p>
              </div>
            </div>
            <div className="prose prose-purple dark:prose-invert max-w-none">
              <RichContent content={analyzeMutation.data.report} />
            </div>
          </div>
        )}
      </div>

      <div className="premium-glass rounded-3xl p-6 md:p-8">
        <h2 className="text-xl font-black mb-6 flex items-center gap-2">
          <History className="text-blue-500" size={20} />
          Останні запити батьків
        </h2>

        {loadingLogs ? (
          <p className="text-gray-500 font-medium">Завантаження логів...</p>
        ) : !logs?.length ? (
          <p className="text-gray-500 font-medium">Поки що немає запитів.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700 text-sm font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  <th 
                    className="pb-4 pl-4 font-bold cursor-pointer hover:text-purple-500 transition-colors"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center gap-1">Дата <ArrowUpDown size={14} /></div>
                  </th>
                  <th className="pb-4 font-bold">Запитання</th>
                  <th 
                    className="pb-4 pr-4 font-bold text-center cursor-pointer hover:text-purple-500 transition-colors"
                    onClick={() => toggleSort('status')}
                  >
                    <div className="flex items-center justify-center gap-1">Статус <ArrowUpDown size={14} /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {sortedLogs.slice(0, 50).map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 pl-4 text-sm font-medium text-gray-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('uk-UA', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-4 pr-4 text-sm font-medium text-gray-800 dark:text-slate-200">
                      {log.question}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex justify-center">
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap',
                          log.sources_found
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                        )}>
                          {log.sources_found ? 'Знайдено' : 'Не знайдено'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length > 50 && (
              <p className="text-center text-sm font-medium text-gray-500 mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
                Показано останні 50 запитів.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
