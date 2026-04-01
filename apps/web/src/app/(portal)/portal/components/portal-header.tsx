'use client';

import { usePortalAuth } from '@/hooks/use-portal-auth';

export function PortalHeader() {
  const { customerName } = usePortalAuth();

  return (
    <header className="border-b border-sand px-4 py-3 bg-transparent">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-xl text-forest-green">{process.env.NEXT_PUBLIC_COMPANY_NAME ?? 'KITEK'}</span>
          <span className="font-body text-sm text-warm-gray">Portal Klienta</span>
        </div>
        {customerName && <span className="font-body text-sm text-charcoal">{customerName}</span>}
      </div>
    </header>
  );
}
