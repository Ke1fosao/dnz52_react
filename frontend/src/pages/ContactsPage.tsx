import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Youtube } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { Spinner } from '@/components/common/Spinner';
import { MapEmbed } from '@/components/common/MapEmbed';
import { useContact } from '@/hooks/useApi';

// --- парсинг телефонів і графіку (з реальних даних) ---
function parsePhones(raw: string): string[] {
  return raw.split(/[,;/]|\sі\s/i).map(s => s.trim()).filter(Boolean);
}
function telHref(p: string) { return `tel:${p.replace(/[^\d+]/g, '')}`; }

interface SchedRow { label: string; time: string; closed: boolean; }
function parseSchedule(raw: string): SchedRow[] {
  return raw.split(/[\n;]+/).map(l => l.trim().replace(/\.$/, '')).filter(Boolean).map(line => {
    const m = line.match(/^([^:—–]{2,40}?)\s*[:—–]\s*(.+)$/);
    const closed = /вихідн|закри|не\s*працю/i.test(line);
    if (m) return { label: m[1].trim(), time: m[2].trim(), closed };
    return { label: '', time: line, closed };
  });
}

export function ContactsPage() {
  const { data, isLoading } = useContact();
  const contact = data?.[0];

  return (
    <div className="animate-page-fade-in pb-24 bg-[#f8fafc] dark:bg-slate-950 min-h-screen relative overflow-hidden">
      <Seo title="Контакти" description="Як з нами звʼязатися — адреса, телефони, карта закладу ЗДО №52" />

      {/* Абстрактні плями фону */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-100/50 dark:from-blue-900/20 to-transparent pointer-events-none" />
      <div className="absolute top-40 -left-40 w-96 h-96 bg-cyan-300/20 dark:bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none animate-float-complex" />
      <div className="absolute top-80 -right-40 w-96 h-96 bg-purple-300/20 dark:bg-purple-600/10 rounded-full blur-[100px] pointer-events-none animate-float-complex" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Заголовок */}
        <div className="mb-12 md:mb-16 flex items-center gap-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-red-400 to-rose-600 rounded-[1.8rem] flex items-center justify-center text-white shadow-lg shadow-red-500/30 rotate-[-10deg] hover:rotate-0 transition-transform duration-300 shrink-0">
            <Phone size={36} className="opacity-90" />
          </div>
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight mb-1">Контакти</h1>
            <p className="text-lg md:text-xl text-gray-500 dark:text-slate-400 font-medium">Ми завжди раді спілкуванню з вами</p>
          </div>
        </div>

        {isLoading ? (
          <Spinner />
        ) : !contact ? (
          <p className="text-center text-gray-400 py-12">Контактна інформація поки не додана.</p>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Ліва колонка */}
            <div className="lg:col-span-5 flex flex-col gap-5 md:gap-6">
              {/* Адреса */}
              <div className="clay-card p-6 flex gap-5 items-start group !rounded-[2rem]">
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/40 text-blue-500 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><MapPin size={28} /></div>
                <div>
                  <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Адреса</div>
                  <div className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{contact.address}</div>
                </div>
              </div>

              {/* Телефони */}
              {contact.phone && (
                <div className="clay-card p-6 flex gap-5 items-start group !rounded-[2rem]">
                  <div className="w-14 h-14 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-500 dark:text-cyan-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Phone size={28} /></div>
                  <div>
                    <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Телефони</div>
                    <div className="flex flex-wrap gap-3">
                      {parsePhones(contact.phone).map((p, i) => (
                        <a key={i} href={telHref(p)} className="px-4 py-2 bg-gray-50 dark:bg-slate-800 rounded-xl text-lg font-bold text-gray-900 dark:text-white hover:bg-cyan-50 dark:hover:bg-cyan-900/50 hover:text-cyan-600 transition-colors flex items-center gap-2">
                          <Phone size={16} className="text-cyan-500" /> {p}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Email */}
              {contact.email && (
                <div className="clay-card p-6 flex gap-5 items-start group !rounded-[2rem]">
                  <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/40 text-purple-500 dark:text-purple-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Mail size={28} /></div>
                  <div>
                    <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Електронна пошта</div>
                    <a href={`mailto:${contact.email}`} className="text-lg md:text-xl font-bold text-purple-600 dark:text-purple-400 hover:underline break-all">{contact.email}</a>
                  </div>
                </div>
              )}

              {/* Режим роботи */}
              {contact.working_hours && (
                <div className="clay-card p-6 flex gap-5 items-start group !rounded-[2rem]">
                  <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/40 text-amber-500 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Clock size={28} /></div>
                  <div className="w-full">
                    <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">Режим роботи</div>
                    <div className="space-y-3">
                      {parseSchedule(contact.working_hours).map((row, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50">
                          {row.label && <div className={`text-sm font-bold mb-1 ${row.closed ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>{row.label}</div>}
                          <div className="text-gray-900 dark:text-slate-300 font-medium text-sm leading-relaxed">{row.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Соцмережі */}
              {(contact.facebook_url || contact.instagram_url || contact.youtube_url) && (
                <div className="clay-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 !rounded-[2rem]">
                  <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Ми у соцмережах</div>
                  <div className="flex gap-3">
                    {contact.facebook_url && <a href={contact.facebook_url} target="_blank" rel="noreferrer" aria-label="Facebook" className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-blue-400 rounded-xl flex items-center justify-center text-white shadow-md hover:scale-110 hover:-translate-y-1 transition-all"><Facebook size={20} /></a>}
                    {contact.instagram_url && <a href={contact.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram" className="w-12 h-12 bg-gradient-to-tr from-pink-500 to-orange-400 rounded-xl flex items-center justify-center text-white shadow-md hover:scale-110 hover:-translate-y-1 transition-all"><Instagram size={20} /></a>}
                    {contact.youtube_url && <a href={contact.youtube_url} target="_blank" rel="noreferrer" aria-label="YouTube" className="w-12 h-12 bg-gradient-to-tr from-red-600 to-red-500 rounded-xl flex items-center justify-center text-white shadow-md hover:scale-110 hover:-translate-y-1 transition-all"><Youtube size={20} /></a>}
                  </div>
                </div>
              )}
            </div>

            {/* Права колонка — карта */}
            <div className="lg:col-span-7 h-[400px] sm:h-[500px] lg:h-auto lg:min-h-[640px]">
              <div className="w-full h-full p-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-white/80 dark:border-slate-700">
                <div className="w-full h-full rounded-[2rem] overflow-hidden [&_iframe]:filter [&_iframe]:dark:invert-[.9] [&_iframe]:dark:hue-rotate-180 [&_iframe]:dark:contrast-125 [&_iframe]:dark:brightness-90">
                  <MapEmbed embed={contact.map_embed} address={contact.address} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
