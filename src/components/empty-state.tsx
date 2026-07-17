import type { ReactNode } from 'react';
import { InboxIcon } from './icons';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-10">
      <div className="w-12 h-12 rounded-full bg-subtle flex items-center justify-center text-muted-foreground mb-4">
        {icon ?? <InboxIcon className="w-6 h-6" />}
      </div>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {description ? (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
