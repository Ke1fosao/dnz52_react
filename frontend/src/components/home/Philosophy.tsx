import { Heart, Lightbulb, Shield, Star } from 'lucide-react';

const VALUES = [
  { icon: Heart, title: 'Любов', desc: 'Приймаємо кожну дитину такою, якою вона є.', color: 'text-pink-500' },
  { icon: Lightbulb, title: 'Розвиток', desc: 'Сучасні STEAM-підходи та інтерактивні ігри.', color: 'text-yellow-500' },
  { icon: Shield, title: 'Безпека', desc: 'Сучасне укриття та закрита територія.', color: 'text-emerald-500' },
];

export function Philosophy() {
  return (
    <section className="py-20 md:py-24 bg-[#f8fafc] dark:bg-slate-900">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          <div className="lg:w-1/2">
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight mb-8">
              Наші <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-400 dark:to-pink-400">цінності</span>
            </h2>
            <div className="space-y-6 md:space-y-8">
              {VALUES.map(v => (
                <div key={v.title} className="flex gap-5 md:gap-6 items-start group">
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.8rem] bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-all border border-gray-100 dark:border-slate-700 ${v.color}`}>
                    <v.icon size={32} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-1.5">{v.title}</h3>
                    <p className="text-lg md:text-xl text-gray-500 dark:text-slate-400 font-medium leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-1/2 w-full">
            <div className="relative w-full aspect-square max-w-[480px] mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-200 to-purple-200 dark:from-slate-800 dark:to-slate-700 rounded-[4rem] rotate-3" />
              <div className="absolute inset-4 bg-gradient-to-bl from-pink-200 to-orange-200 dark:from-slate-800 dark:to-slate-700 rounded-[3rem] -rotate-3 border-4 border-white dark:border-slate-600 shadow-2xl flex flex-col items-center justify-center text-center p-10">
                <div className="text-7xl md:text-8xl font-black text-gray-900 dark:text-white mb-3">40+</div>
                <div className="text-xl md:text-2xl font-bold text-gray-700 dark:text-slate-300 uppercase tracking-widest">Років досвіду</div>
                <div className="mt-6 flex gap-2">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={22} className="text-yellow-500 fill-yellow-500" />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
