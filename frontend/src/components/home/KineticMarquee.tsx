import { Star, Smile, Heart } from 'lucide-react';

export function KineticMarquee() {
  const block = (
    <div className="flex items-center gap-12 text-4xl md:text-6xl font-black text-gray-900/10 dark:text-white/10 uppercase tracking-tighter shrink-0 pr-12">
      <span>Світ дитинства</span><Star size={40} className="text-yellow-400 opacity-50 dark:opacity-30 shrink-0" />
      <span>ЗДО №52</span><Smile size={40} className="text-blue-400 opacity-50 dark:opacity-30 shrink-0" />
      <span>М. Рівне</span><Heart size={40} className="text-pink-400 opacity-50 dark:opacity-30 shrink-0" />
    </div>
  );

  return (
    <div className="bg-[#f8fafc] dark:bg-slate-950 py-10 overflow-hidden flex items-center relative -mt-4 border-b border-gray-200/50 dark:border-slate-800/50">
      <div className="absolute left-0 w-24 md:w-32 h-full bg-gradient-to-r from-[#f8fafc] dark:from-slate-950 to-transparent z-10" />
      <div className="absolute right-0 w-24 md:w-32 h-full bg-gradient-to-l from-[#f8fafc] dark:from-slate-950 to-transparent z-10" />
      <div className="animate-marquee">
        {block}{block}{block}{block}
      </div>
    </div>
  );
}
