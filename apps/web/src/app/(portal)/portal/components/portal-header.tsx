'use client';

import { usePortalAuth } from '@/hooks/use-portal-auth';

export function PortalHeader() {
  const { customerName } = usePortalAuth();

  return (
    <header className="border-b bg-white px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">KITEK</span>
          <span className="text-sm text-muted-foreground">Portal Klienta</span>
        </div>
        {customerName && (
          <span className="text-sm text-muted-foreground">{customerName}</span>
        )}
      </div>
    </header>
  );
}
