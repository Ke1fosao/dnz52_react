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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-primary-300">
        {icon || <Inbox className="h-16 w-16" />}
      </div>
      <h3 className="font-display text-xl font-bold mb-1">{title}</h3>
      {description && <p className="text-muted-foreground max-w-md mb-4">{description}</p>}
      {action}
    </div>
  );
}
