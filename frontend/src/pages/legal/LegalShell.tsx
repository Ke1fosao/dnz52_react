import { ReactNode } from 'react';
import { Seo } from '@/components/common/Seo';
import { PageHero } from '@/components/common/PageHero';

interface ShellProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  variant?: 'primary' | 'warm' | 'sky' | 'soft';
  updated?: string;
  children: ReactNode;
}

export function LegalShell({ title, subtitle, icon, variant = 'soft', updated, children }: ShellProps) {
  return (
    <div className="container mx-auto px-4 max-w-3xl">
      <Seo title={title} description={subtitle} />
      <PageHero title={title} subtitle={subtitle} icon={icon} variant={variant} />
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-10 shadow-sm border border-gray-100 dark:border-slate-800 mb-12">
        {updated && (
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-6">Редакція від {updated}</p>
        )}
        <div className="space-y-8 text-gray-600 dark:text-slate-300 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

export function LSection({ n, title, children }: { n?: number; title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-3">
        {n ? <span className="text-blue-500 dark:text-blue-400">{n}.</span> : null} {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function LList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2 pl-1">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
