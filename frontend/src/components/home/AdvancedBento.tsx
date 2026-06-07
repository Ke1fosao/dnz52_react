import { Link } from 'react-router-dom';
import { Users, Coffee, MapPin, Image as ImageIcon, ArrowRight, Newspaper } from 'lucide-react';

export function AdvancedBento() {
  return (
    <section className="py-20 md:py-24 relative">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight mb-3">Наш Всесвіт</h2>
          <p className="text-lg md:text-xl text-gray-500 dark:text-slate-400 font-medium">Швидкий доступ до головних розділів садка</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-5 md:gap-6 auto-rows-[230px]">
          {/* Групи — велика картка (теплий градієнт замість стокового фото) */}
          <Link to="/groups" className="clay-card md:col-span-4 md:row-span-2 p-8 md:p-10 relative overflow-hidden group flex flex-col justify-end !rounded-[2.5rem] bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 dark:from-indigo-700 dark:via-violet-800 dark:to-fuchsia-900">
            {/* декоративні плями + емодзі */}
            <div className="absolute -top-20 -right-12 w-72 h-72 bg-white/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
            <div className="absolute -bottom-16 -left-10 w-64 h-64 bg-fuchsia-300/30 rounded-full blur-3xl" />
            <div className="absolute top-6 right-8 text-[8rem] leading-none opacity-25 group-hover:rotate-6 group-hover:scale-105 transition-transform duration-700 select-none">🧸</div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/25 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-5 border border-white/40"><Users size={32} /></div>
              <h3 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight group-hover:translate-x-2 transition-transform">Вікові групи</h3>
              <p className="text-lg md:text-xl text-white/90 font-medium max-w-md">Від найменших ясельних до майбутніх першокласників. Знайомтесь з нашими групами та вихователями.</p>
              <span className="inline-flex items-center gap-2 mt-5 text-white font-bold text-sm bg-white/15 backdrop-blur-md border border-white/25 px-4 py-2 rounded-full group-hover:bg-white/25 transition-colors">
                Переглянути групи <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>

          {/* Меню */}
          <Link to="/menu" className="clay-card md:col-span-2 p-7 relative overflow-hidden group bg-gradient-to-br from-orange-100 to-orange-200 dark:!from-slate-800 dark:!to-slate-800 !rounded-[2.5rem]">
            <div className="absolute -right-6 -top-6 text-9xl opacity-20 group-hover:rotate-12 transition-transform duration-500">🍎</div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <Coffee size={40} className="text-orange-600 dark:text-orange-400" />
              <div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1">Меню</h3>
                <p className="text-gray-700 dark:text-slate-400 font-medium">Раціон на сьогодні</p>
              </div>
            </div>
          </Link>

          {/* Контакти */}
          <Link to="/contacts" className="clay-card md:col-span-1 p-7 relative overflow-hidden group bg-gradient-to-br from-emerald-100 to-teal-200 dark:!from-slate-800 dark:!to-slate-800 !rounded-[2.5rem]">
            <div className="absolute -right-6 -bottom-6 text-8xl opacity-20 group-hover:rotate-12 transition-transform duration-500">📍</div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm"><MapPin size={24} /></div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Контакти</h3>
                <p className="text-gray-700 dark:text-slate-400 font-medium text-sm">Звʼязок з нами</p>
              </div>
            </div>
          </Link>

          {/* Галерея */}
          <Link to="/gallery" className="clay-card md:col-span-1 p-7 relative overflow-hidden group bg-gradient-to-br from-pink-100 to-rose-200 dark:!from-slate-800 dark:!to-slate-800 !rounded-[2.5rem]">
            <div className="absolute -left-6 -bottom-6 text-8xl opacity-20 group-hover:-translate-y-4 transition-transform duration-500">📸</div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-pink-600 dark:text-pink-400 shadow-sm"><ImageIcon size={24} /></div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Галерея</h3>
                <p className="text-gray-700 dark:text-slate-400 font-medium text-sm">Фото та відео</p>
              </div>
            </div>
          </Link>

          {/* Батькам — широка темна */}
          <Link to="/parents" className="md:col-span-3 relative overflow-hidden group bg-slate-900 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 hover:scale-[1.01] hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-40 group-hover:opacity-80 transition-opacity duration-700 blur-xl" />
            <div className="relative h-full w-full bg-slate-900/90 backdrop-blur-3xl rounded-[2.5rem] p-7 md:p-8 flex items-center justify-between z-10 overflow-hidden gap-5">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/30 rounded-full blur-[60px] group-hover:scale-150 transition-all duration-700 pointer-events-none" />
              <div className="relative z-10">
                <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-blue-300 font-bold text-xs uppercase tracking-widest mb-3 border border-white/10">Батькам</div>
                <h3 className="text-2xl md:text-4xl font-black mb-2 tracking-tight text-white">Документи та правила</h3>
                <p className="text-gray-400 text-base md:text-lg font-medium max-w-md">Усе, що потрібно знати батькам, в одному місці.</p>
              </div>
              <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:-rotate-12 group-hover:bg-white group-hover:text-gray-900 transition-all duration-500 text-white shrink-0"><ArrowRight size={32} /></div>
            </div>
          </Link>

          {/* Новини — заповнює ряд, корисний розділ */}
          <Link to="/news" className="clay-card md:col-span-3 p-7 md:p-8 relative overflow-hidden group bg-gradient-to-br from-sky-100 to-indigo-200 dark:!from-slate-800 dark:!to-slate-800 !rounded-[2.5rem]">
            <div className="absolute -right-6 -bottom-8 text-9xl opacity-20 group-hover:rotate-6 transition-transform duration-500">📰</div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-sm"><Newspaper size={24} /></div>
                <ArrowRight size={22} className="text-sky-500/70 dark:text-sky-400/70 group-hover:translate-x-1 transition-transform" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-1">Новини та події</h3>
                <p className="text-gray-700 dark:text-slate-400 font-medium text-sm">Свіжі події, свята й оголошення садочка</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
