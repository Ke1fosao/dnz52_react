import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Loader2, Info, CalendarRange, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminMenuTemplatesApi, adminAiApi } from '../lib/adminApi';
import { MEALS } from '../lib/menuMeals';
import { Toggle } from '../components/FormControls';
import { ListSkeleton } from '../components/AdminUI';
import { cn } from '@/lib/utils';
import type { AdminMenuTemplate } from '../types';

const mealCls =
  'w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 dark:text-white text-sm resize-y placeholder:text-gray-400 dark:placeholder:text-slate-500';

export function MenuTemplatesPage({ embedded = false }: { embedded?: boolean } = {}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-menu-templates'], queryFn: adminMenuTemplatesApi.get });
  const [rows, setRows] = useState<AdminMenuTemplate[]>([]);
  const [saving, setSaving] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<number | null>(null);

  useEffect(() => { if (data) setRows(data); }, [data]);

  const setCell = (wd: number, key: string, value: unknown) =>
    setRows(rs => rs.map(r => (r.weekday === wd ? { ...r, [key]: value } : r)));

  const generateDietAi = async (weekday: number, r: AdminMenuTemplate) => {
    const mealsText = MEALS.map(m => {
      const val = r[m.key as keyof typeof r] as string;
      return val.trim() ? `${m.label}: ${val}` : '';
    }).filter(Boolean).join('. ');

    if (!mealsText) {
      toast.error('Спочатку заповніть принаймні один прийом їжі');
      return;
    }

    setGeneratingFor(weekday);
    try {
      const brief = `Меню на сьогодні: ${mealsText}`;
      const res = await adminAiApi.generate(brief, 'diet', 'warm');
      const plainText = res.text.replace(/<[^>]*>?/gm, '');
      setCell(weekday, 'note', plainText.slice(0, 300));
      toast.success('ШІ успішно згенерував опис раціону');
    } catch (e) {
      toast.error('Не вдалося згенерувати опис ШІ');
    } finally {
      setGeneratingFor(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const fresh = await adminMenuTemplatesApi.save(rows);
      qc.setQueryData(['admin-menu-templates'], fresh);
      setRows(fresh);
      toast.success('Шаблон тижня збережено');
    } catch { toast.error('Не вдалося зберегти'); } finally { setSaving(false); }
  };

  const SaveBtn = ({ className }: { className?: string }) => (
    <button type="button" onClick={save} disabled={saving || isLoading}
      className={cn('inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl transition-colors', className)}>
      {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Зберегти все
    </button>
  );

  return (
    <div className="space-y-5 animate-page-fade-in">
      {embedded ? (
        <div className="flex justify-end"><SaveBtn /></div>
      ) : (
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 text-white grid place-items-center shrink-0"><CalendarRange size={24} /></span>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Шаблон тижня</h1>
              <p className="text-gray-500 dark:text-slate-400 font-medium">Меню-основа за днями тижня</p>
            </div>
          </div>
          <SaveBtn />
        </div>
      )}

      <div className="premium-glass rounded-2xl p-4 flex gap-3 text-sm text-gray-600 dark:text-slate-300">
        <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <p>
          Заповніть страви для кожного дня тижня <b>один раз</b> — і це меню показуватиметься на сайті <b>щотижня автоматично</b>.
          Якщо на конкретну дату створити окреме «Меню на день» — воно матиме пріоритет над шаблоном.
        </p>
      </div>

      {isLoading ? <ListSkeleton rows={4} /> : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {rows.map(r => (
              <div key={r.weekday} className={cn('premium-glass rounded-[1.5rem] p-5 space-y-3 transition-opacity', !r.is_active && 'opacity-60')}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-gray-900 dark:text-white">{r.weekday_display}</h3>
                    {!r.is_active && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-slate-400 uppercase">Вимкнено</span>}
                  </div>
                  <Toggle checked={r.is_active} onChange={v => setCell(r.weekday, 'is_active', v)} label="" />
                </div>
                {MEALS.map(meal => (
                  <div key={meal.key}>
                    <label className="block text-xs font-bold mb-1 text-gray-600 dark:text-slate-400">{meal.emoji} {meal.label}</label>
                    <textarea rows={2} className={mealCls} value={r[meal.key]} onChange={e => setCell(r.weekday, meal.key, e.target.value)} placeholder="—" />
                  </div>
                ))}
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-gray-600 dark:text-slate-400">📝 Примітка</label>
                    <input className={mealCls} value={r.note} onChange={e => setCell(r.weekday, 'note', e.target.value)} placeholder="Необов'язково" maxLength={300} />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => generateDietAi(r.weekday, r)}
                    disabled={generatingFor === r.weekday}
                    className="self-start text-xs inline-flex items-center gap-1.5 text-purple-600 hover:text-purple-700 font-bold px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Wand2 size={14} /> {generatingFor === r.weekday ? 'Генерується...' : 'Згенерувати опис ШІ'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-1"><SaveBtn /></div>
        </>
      )}
    </div>
  );
}
