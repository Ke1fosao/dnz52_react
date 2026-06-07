import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, CalendarPlus, Download, CalendarX2, CalendarDays } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { EventLD, BreadcrumbLD } from '@/components/common/JsonLd';
import { PageHero } from '@/components/common/PageHero';
import { Spinner } from '@/components/common/Spinner';
import { RichContent } from '@/components/common/RichContent';
import { useEvents } from '@/hooks/useApi';
import type { EventItem } from '@/types';

const MONTHS = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

function timeStr(iso: string): string {
  return new Date(iso).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

function gcalUrl(ev: EventItem): string {
  const fmt = (d: string) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const start = fmt(ev.start_date);
  const end = fmt(ev.end_date || ev.start_date);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${start}/${end}`,
    details: (ev.description || '').replace(/<[^>]+>/g, '').slice(0, 500),
    location: ev.location || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function EventsPage() {
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() }); // month 0-11
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { data: events, isLoading } = useEvents(view.year, view.month + 1);

  const byDay = useMemo(() => {
    const map: Record<number, EventItem[]> = {};
    (events || []).forEach(ev => {
      const d = new Date(ev.start_date);
      if (d.getFullYear() === view.year && d.getMonth() === view.month) {
        (map[d.getDate()] ||= []).push(ev);
      }
    });
    return map;
  }, [events, view]);

  const leadBlanks = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(leadBlanks).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const isToday = (day: number) =>
    today.getFullYear() === view.year && today.getMonth() === view.month && today.getDate() === day;

  const go = (delta: number) => {
    setSelectedDay(null);
    setView(v => {
      const m = v.month + delta;
      if (m < 0) return { year: v.year - 1, month: 11 };
      if (m > 11) return { year: v.year + 1, month: 0 };
      return { ...v, month: m };
    });
  };
  const goToday = () => { setView({ year: today.getFullYear(), month: today.getMonth() }); setSelectedDay(today.getDate()); };

  const listEvents = selectedDay ? (byDay[selectedDay] || []) : (events || []);
  const listTitle = selectedDay ? `Події ${selectedDay} ${MONTHS[view.month].toLowerCase()}` : `Усі події — ${MONTHS[view.month]} ${view.year}`;

  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <Seo
        title="Календар подій"
        description="Свята, ранки, батьківські збори та заходи ЗДО №52, м. Рівне — календар подій дитячого садка."
        path="/events"
      />
      <BreadcrumbLD crumbs={[
        { name: 'Головна', url: '/' },
        { name: 'Календар подій', url: '/events' },
      ]} />
      {/* JSON-LD для кожної події поточного місяця */}
      {(events || []).map(ev => (
        <EventLD
          key={ev.id}
          name={ev.title}
          startDate={ev.start_date}
          endDate={ev.end_date}
          location={ev.location}
          description={ev.description}
          image={ev.image}
          slug={ev.slug}
          eventType={ev.event_type_display}
        />
      ))}
      <PageHero title="Календар подій" subtitle="Свята, ранки, збори та цікаві заходи нашого садочка" icon="📅" variant="sky" />

      <div className="grid lg:grid-cols-5 gap-6 pb-12">
        {/* Календар */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-4 md:p-6 shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{MONTHS[view.month]} {view.year}</h2>
              <div className="flex items-center gap-2">
                <button onClick={goToday} className="text-xs font-bold px-3 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">Сьогодні</button>
                <button onClick={() => go(-1)} aria-label="Попередній місяць" className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"><ChevronLeft size={18} /></button>
                <button onClick={() => go(1)} aria-label="Наступний місяць" className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"><ChevronRight size={18} /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 md:gap-2 mb-1">
              {WEEKDAYS.map(w => <div key={w} className="text-center text-[11px] font-black uppercase tracking-wide text-gray-400 dark:text-slate-500 py-1">{w}</div>)}
            </div>

            {isLoading ? (
              <div className="py-10"><Spinner /></div>
            ) : (
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {cells.map((day, i) => {
                  if (day === null) return <div key={`b${i}`} />;
                  const dayEvents = byDay[day] || [];
                  const selected = selectedDay === day;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(selected ? null : day)}
                      className={`min-h-[64px] md:min-h-[92px] rounded-2xl p-1.5 md:p-2 text-left flex flex-col gap-1 border transition-all ${
                        selected ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/30'
                        : 'border-transparent hover:border-gray-200 dark:hover:border-slate-700'
                      } ${dayEvents.length ? 'bg-gray-50 dark:bg-slate-800/50' : ''}`}
                    >
                      <span className={`text-xs md:text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0 ${
                        isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-slate-300'
                      }`}>{day}</span>
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        {dayEvents.slice(0, 2).map(ev => (
                          <span key={ev.id} className="text-[9px] md:text-[10px] font-bold text-white px-1.5 py-0.5 rounded-md truncate leading-tight" style={{ background: ev.color }} title={ev.title}>
                            {ev.title}
                          </span>
                        ))}
                        {dayEvents.length > 2 && <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 px-1">+{dayEvents.length - 2}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Список подій */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-black text-gray-900 dark:text-white">{listTitle}</h2>
            {selectedDay && <button onClick={() => setSelectedDay(null)} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Усі</button>}
          </div>

          {isLoading ? (
            <Spinner />
          ) : listEvents.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 text-center shadow-sm border border-gray-100 dark:border-slate-800">
              <CalendarX2 className="h-12 w-12 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
              <p className="text-gray-500 dark:text-slate-400 font-medium">{selectedDay ? 'Цього дня подій немає' : 'Цього місяця подій поки немає'}</p>
            </div>
          ) : (
            listEvents.map(ev => <EventCard key={ev.id} ev={ev} />)
          )}
        </div>
      </div>
    </div>
  );
}

function EventCard({ ev }: { ev: EventItem }) {
  const start = new Date(ev.start_date);
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-sm border border-gray-100 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-black text-white px-2.5 py-1 rounded-full" style={{ background: ev.color }}>{ev.event_type_display}</span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 dark:text-slate-500">
          <CalendarDays size={13} /> {start.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
        </span>
      </div>
      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 leading-snug">{ev.title}</h3>
      <div className="flex flex-wrap gap-3 text-sm font-medium text-gray-500 dark:text-slate-400 mb-3">
        <span className="inline-flex items-center gap-1.5"><Clock size={14} style={{ color: ev.color }} /> {timeStr(ev.start_date)}{ev.end_date && !ev.is_multiday ? `–${timeStr(ev.end_date)}` : ''}</span>
        {ev.location && <span className="inline-flex items-center gap-1.5"><MapPin size={14} style={{ color: ev.color }} /> {ev.location}</span>}
      </div>
      {ev.description && <div className="text-sm text-gray-600 dark:text-slate-300 mb-4"><RichContent content={ev.description} /></div>}
      <div className="flex flex-wrap gap-2">
        <a href={gcalUrl(ev)} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-full hover:-translate-y-0.5 transition-transform" style={{ background: ev.color }}>
          <CalendarPlus size={14} /> Google Calendar
        </a>
        <a href={`/api/v1/events/${ev.slug}/ical/`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 px-4 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
          <Download size={14} /> iCal (.ics)
        </a>
      </div>
    </div>
  );
}
