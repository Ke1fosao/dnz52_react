import { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface Props {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title = 'Поки нічого немає', description, icon, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center animate-scale-in">
      <div className="mb-5 w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-slate-800 dark:to-slate-800/40 flex items-center justify-center text-blue-500 dark:text-blue-300 shadow-sm rotate-[-6deg] hover:rotate-0 transition-transform duration-300">
        {icon || <Inbox className="h-12 w-12" />}
      </div>
      <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && <p className="text-gray-500 dark:text-slate-400 max-w-md mb-5 font-medium">{description}</p>}
      {action}
    </div>
  );
}
