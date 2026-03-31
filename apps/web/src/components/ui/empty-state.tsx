import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="relative flex flex-col items-center justify-center py-12 text-center overflow-hidden">
      <span
        className="absolute select-none pointer-events-none font-display font-medium text-[48px] leading-none text-warm-gray opacity-15"
        aria-hidden="true"
      >
        {title}
      </span>
      <h3 className="relative font-body text-sm text-muted-foreground">{title}</h3>
      {description && (
        <p className="relative mt-1 font-body text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
