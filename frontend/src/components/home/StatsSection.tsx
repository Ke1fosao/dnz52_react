import { AnimatedCounter } from '@/components/common/AnimatedCounter';
import { Reveal } from '@/components/common/Reveal';
import { SpotlightCard } from '@/components/common/SpotlightCard';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const STATS = [
  { value: 11, suffix: '', label: 'груп', emoji: '🏫' },
  { value: 280, suffix: '+', label: 'вихованців', emoji: '👦' },
  { value: 40, suffix: '+', label: 'років досвіду', emoji: '⭐' },
  { value: 12, suffix: '', label: 'гуртків', emoji: '🎨' },
];

/**
 * Секція статистики зі лічильниками на головній.
 * Числа «накручуються» при появі у viewport.
 */
export function StatsSection() {
  const reduced = useReducedMotion();

  return (
    <section className="py-16 md:py-20 bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
      {/* Декоративний фон */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/60 via-purple-100/40 to-pink-100/60 dark:from-blue-900/30 dark:via-purple-900/20 dark:to-pink-900/30" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/15 dark:bg-blue-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/15 dark:bg-purple-500/10 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <Reveal variant="fade-up" className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
            Наш заклад у <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">цифрах</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Понад 40 років турботи про дітей Рівного</p>
        </Reveal>

        <Reveal stagger className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} variant="scale" delay={i * 0.1}>
              <SpotlightCard className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-md border border-gray-200/80 dark:border-slate-700/50 rounded-3xl h-full shadow-sm dark:shadow-none">
                <div className="p-6 md:p-8 text-center group hover:-translate-y-2 transition-transform duration-300 relative z-10">
                  <div className="text-4xl mb-3">{stat.emoji}</div>
                  <div className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-2 tabular-nums">
                    {reduced ? (
                      <span>{stat.value}{stat.suffix}</span>
                    ) : (
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    )}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 font-bold text-sm md:text-base uppercase tracking-widest">{stat.label}</div>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
