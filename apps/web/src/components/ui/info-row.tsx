import type { ReactNode } from 'react';

interface InfoRowProps {
  label: string;
  value: ReactNode;
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex flex-row items-baseline justify-between min-h-9 gap-4">
      <span className="font-body font-medium text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="font-body text-sm text-foreground">{value || '-'}</span>
    </div>
  );
}
