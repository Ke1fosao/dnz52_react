import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminDailyMenuApi, adminMenuTemplatesApi, adminAiApi } from '../lib/adminApi';
import { MEALS, localDate, pyWeekday } from '../lib/menuMeals';
import { Field, inputCls, Toggle, FormHeader, FormActions } from '../components/FormControls';

const BLANK = { date: '', breakfast: '', second_breakfast: '', lunch: '', snack: '', dinner: '', note: '', is_published: true };

export function DailyMenuFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: existing } = useQuery({ queryKey: ['admin-menu', id], queryFn: () => adminDailyMenuApi.get(id!), enabled: editing });
  const { data: templates } = useQuery({ queryKey: ['admin-menu-templates'], queryFn: adminMenuTemplatesApi.get });

  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        date: existing.date, breakfast: existing.breakfast || '', second_breakfast: existing.second_breakfast || '',
        lunch: existing.lunch || '', snack: existing.snack || '', dinner: existing.dinner || '',
        note: existing.note || '', is_published: existing.is_published,
      });
    }
  }, [existing]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }) as typeof form);

  const weekday = form.date ? localDate(form.date).toLocaleDateString('uk-UA', { weekday: 'long' }) : '';

  const fillFromTemplate = () => {
    if (!form.date) { toast.error('Спочатку виберіть дату'); return; }
    const t = templates?.find(x => x.weekday === pyWeekday(form.date));
    if (!t || !MEALS.some(m => (t[m.key] || '').trim())) { toast.message('Для цього дня тижня шаблон порожній'); return; }
    setForm(f => ({
      ...f,
      ...Object.fromEntries(MEALS.map(m => [m.key, t[m.key] || ''])),
      note: t.note || f.note,
    }) as typeof form);
    toast.success('Заповнено з шаблону тижня');
  };

  const generateDietAi = async () => {
    const mealsText = MEALS.map(m => {
      const val = form[m.key as keyof typeof form] as string;
      return val.trim() ? `${m.label}: ${val}` : '';
    }).filter(Boolean).join('. ');

    if (!mealsText) {
      toast.error('Спочатку заповніть принаймні один прийом їжі');
      return;
    }

    setGenerating(true);
    try {
      const brief = `Меню на сьогодні: ${mealsText}`;
      const res = await adminAiApi.generate(brief, 'diet', 'warm');
      const plainText = res.text.replace(/<[^>]*>?/gm, '');
      set('note', plainText.slice(0, 300));
      toast.success('ШІ успішно згенерував опис раціону');
    } catch (e) {
      toast.error('Не вдалося згенерувати опис ШІ');
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!form.date) { toast.error('Виберіть дату'); return; }
    setSaving(true);
    try {
      if (editing) await adminDailyMenuApi.update(id!, form); else await adminDailyMenuApi.create(form);
      qc.invalidateQueries({ queryKey: ['admin-menu'] });
      toast.success(editing ? 'Збережено' : 'Меню додано');
      nav('/manage/menu');
    } catch (e) {
      const dateErr = (e as { response?: { data?: { date?: unknown } } }).response?.data?.date;
      toast.error(dateErr ? 'Меню на цю дату вже існує' : 'Не вдалося зберегти');
    } finally { setSaving(false); }
  };

  const del = async () => {
    if (!window.confirm('Видалити це меню?')) return;
    try { await adminDailyMenuApi.remove(id!); qc.invalidateQueries({ queryKey: ['admin-menu'] }); toast.success('Видалено'); nav('/manage/menu'); } catch { toast.error('Помилка'); }
  };

  return (
    <div className="animate-page-fade-in max-w-3xl">
      <FormHeader title={editing ? 'Редагувати меню' : 'Нове меню на день'} backTo="/manage/menu" />
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Дата" required>
            <div className="flex items-center gap-3">
              <input type="date" className={inputCls} value={form.date} onChange={e => set('date', e.target.value)} />
              {weekday && <span className="text-sm font-bold text-blue-600 dark:text-blue-400 capitalize shrink-0">{weekday}</span>}
            </div>
          </Field>
          <button type="button" onClick={fillFromTemplate}
            className="inline-flex items-center gap-2 premium-glass hover:-translate-y-0.5 text-violet-600 dark:text-violet-400 font-bold px-4 py-3 rounded-2xl transition-transform">
            <Wand2 size={18} /> Заповнити з шаблону
          </button>
        </div>

        <div className="grid gap-4">
          {MEALS.map(meal => (
            <Field key={meal.key} label={`${meal.emoji} ${meal.label}`}>
              <textarea className={`${inputCls} resize-y`} rows={2} value={form[meal.key]} onChange={e => set(meal.key, e.target.value)} placeholder="Залиште порожнім, якщо цього прийому їжі немає" />
            </Field>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Field label="Примітка дня" hint="Напр. «Святкове меню до Дня матері» або позначення алергенів">
            <input className={inputCls} value={form.note} onChange={e => set('note', e.target.value)} maxLength={300} />
          </Field>
          <button 
            type="button" 
            onClick={generateDietAi}
            disabled={generating}
            className="self-start text-sm inline-flex items-center gap-1.5 text-purple-600 hover:text-purple-700 font-bold px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 rounded-lg transition-colors disabled:opacity-50"
          >
            <Wand2 size={16} /> {generating ? 'Генерується...' : 'Згенерувати опис ШІ'}
          </button>
        </div>

        <Toggle checked={form.is_published} onChange={v => set('is_published', v)} label="Опубліковано (показується на сайті)" />

        <FormActions onSave={save} saving={saving} onDelete={editing ? del : undefined} cancelTo="/manage/menu" />
      </div>
    </div>
  );
}
