import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, UserRound, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { adminSpecialistPagesApi, adminSpecialistPeopleApi, adminSpecialistSectionsApi } from '../lib/adminApi';
import { Field, inputCls, MarkdownEditor, FormHeader, FormActions } from '../components/FormControls';
import { SortableList, persistOrder } from '../components/SortableList';

export function SpecialistPageFormPage() {
  const { id } = useParams();
  const pageId = Number(id);
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: existing } = useQuery({ queryKey: ['admin-specialist-page', id], queryFn: () => adminSpecialistPagesApi.get(id!) });
  const [form, setForm] = useState({ title: '', intro: '', description: '', theme_title: '', theme_period: '', theme_text: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) setForm({
      title: existing.title || '', intro: existing.intro || '', description: existing.description || '',
      theme_title: existing.theme_title || '', theme_period: existing.theme_period || '', theme_text: existing.theme_text || '',
    });
  }, [existing]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }) as typeof form);

  const save = async () => {
    if (!form.title.trim()) { toast.error('Вкажіть заголовок'); return; }
    setSaving(true);
    try {
      await adminSpecialistPagesApi.update(id!, form);
      qc.invalidateQueries({ queryKey: ['admin-specialist-pages'] });
      toast.success('Збережено');
    } catch { toast.error('Не вдалося зберегти'); } finally { setSaving(false); }
  };

  return (
    <div className="animate-page-fade-in max-w-3xl">
      <FormHeader title={existing?.page_type_display || 'Сторінка спеціаліста'} backTo="/manage/specialists" />
      <div className="premium-glass rounded-[1.8rem] p-6 space-y-5">
        <Field label="Заголовок сторінки" required><input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} /></Field>
        <Field label="Вступний текст" hint="Короткий текст під заголовком"><textarea className={`${inputCls} resize-y`} rows={2} value={form.intro} onChange={e => set('intro', e.target.value)} /></Field>
        <Field label="Опис діяльності" hint="Markdown — програми, методи роботи тощо"><MarkdownEditor value={form.description} onChange={v => set('description', v)} rows={6} /></Field>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Науково-методична тема"><input className={inputCls} value={form.theme_title} onChange={e => set('theme_title', e.target.value)} /></Field>
          <Field label="Період теми" hint="Напр. 2022–2027 роки"><input className={inputCls} value={form.theme_period} onChange={e => set('theme_period', e.target.value)} /></Field>
        </div>
        <Field label="Текст теми"><textarea className={`${inputCls} resize-y`} rows={2} value={form.theme_text} onChange={e => set('theme_text', e.target.value)} /></Field>
        <FormActions onSave={save} saving={saving} cancelTo="/manage/specialists" />
      </div>

      {/* Спеціалісти */}
      <div className="mt-6">
        <h2 className="text-lg font-black text-gray-900 dark:text-white mb-3">Спеціалісти</h2>
        <ChildNavList
          qKey={`spec-people-${pageId}`} parentId={pageId} api={adminSpecialistPeopleApi}
          addLabel="Додати спеціаліста" onAdd={() => nav(`/manage/specialists/${pageId}/people/new`)}
          onEdit={(it) => nav(`/manage/specialists/${pageId}/people/${it.id}`)}
          renderRow={(it) => (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {it.photo ? <img src={it.photo as string} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
                : <span className="w-11 h-11 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-500 grid place-items-center shrink-0"><UserRound size={18} /></span>}
              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-white truncate">{(it.full_name as string) || '—'}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{it.position as string}</p>
              </div>
            </div>
          )}
        />
      </div>

      {/* Розділи */}
      <div className="mt-6">
        <h2 className="text-lg font-black text-gray-900 dark:text-white mb-3">Розділи сторінки</h2>
        <ChildNavList
          qKey={`spec-sections-${pageId}`} parentId={pageId} api={adminSpecialistSectionsApi}
          addLabel="Додати розділ" onAdd={() => nav(`/manage/specialists/${pageId}/sections/new`)}
          onEdit={(it) => nav(`/manage/specialists/${pageId}/sections/${it.id}`)}
          renderRow={(it) => (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-500 grid place-items-center shrink-0 text-lg">{it.icon ? <i className={`bi ${it.icon}`} /> : '📂'}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 dark:text-white truncate">{(it.title as string) || '—'}</p>
                  {it.is_active === false && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-slate-400 uppercase">off</span>}
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{it.kind_display as string}{it.photos_count ? ` · ${it.photos_count} фото` : ''}</p>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}

interface NavRow { id: number; order?: number }
interface NavApi<T> {
  listFor: (parentId: number) => Promise<T[]>;
  update: (id: number, data: object) => Promise<T>;
  remove: (id: number) => Promise<unknown>;
}

function ChildNavList<T extends NavRow>({ qKey, parentId, api, addLabel, onAdd, onEdit, renderRow }: {
  qKey: string; parentId: number; api: NavApi<T>; addLabel: string;
  onAdd: () => void; onEdit: (item: T) => void; renderRow: (item: T) => ReactNode;
}) {
  const qc = useQueryClient();
  const key = ['admin-childnav', qKey];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => api.listFor(parentId) });
  const invalidate = () => qc.invalidateQueries({ queryKey: key });
  const rows = data || [];
  const remove = useMutation({ mutationFn: api.remove, onSuccess: () => { toast.success('Видалено'); invalidate(); }, onError: () => toast.error('Помилка') });

  const handleReorder = async (next: T[]) => {
    qc.setQueryData(key, next);
    try { await persistOrder(next, (id, data) => api.update(id, data)); } catch { toast.error('Помилка'); }
    invalidate();
  };

  return (
    <div className="space-y-2">
      {isLoading ? <p className="text-sm text-gray-400 dark:text-slate-500">Завантаження…</p>
        : (
          <SortableList items={rows} getId={it => it.id} onReorder={handleReorder} className="space-y-2">
            {(it, dnd) => (
              <div ref={dnd.setNodeRef} style={dnd.style} className="premium-glass rounded-2xl p-3 flex items-center gap-3">
                <button {...dnd.handleProps} className="cursor-grab active:cursor-grabbing touch-none text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 shrink-0" aria-label="Перетягнути"><GripVertical size={18} /></button>
                {renderRow(it)}
                <button onClick={() => onEdit(it)} className="w-8 h-8 grid place-items-center rounded-lg bg-white/60 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0" aria-label="Редагувати"><Pencil size={15} /></button>
                <button onClick={() => { if (window.confirm('Видалити цей запис?')) remove.mutate(it.id); }} className="w-8 h-8 grid place-items-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors shrink-0" aria-label="Видалити"><Trash2 size={15} /></button>
              </div>
            )}
          </SortableList>
        )}
      <button onClick={onAdd} className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 font-bold text-sm px-4 py-2 rounded-xl text-gray-700 dark:text-slate-300 transition-colors">
        <Plus size={16} /> {addLabel}
      </button>
    </div>
  );
}
