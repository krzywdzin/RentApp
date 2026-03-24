'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePortalAuth } from '@/hooks/use-portal-auth';
import { Loader2 } from 'lucide-react';

export function TokenExchange() {
  const searchParams = useSearchParams();
  const { exchangeToken, isLoading, error } = usePortalAuth();
  const exchangeAttempted = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const customerId = searchParams.get('cid');

    if (token && customerId && !exchangeAttempted.current) {
      exchangeAttempted.current = true;

      exchangeToken(token, customerId).then((success) => {
        if (success) {
          // Strip token from URL for security (prevent leakage via browser history)
          const url = new URL(window.location.href);
          url.searchParams.delete('token');
          url.searchParams.delete('cid');
          window.history.replaceState({}, '', url.pathname);
        }
      });
    }
  }, [searchParams, exchangeToken]);

  const hasTokenParams = searchParams.get('token') && searchParams.get('cid');

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-700">
        {error}
      </div>
    );
  }

  if (hasTokenParams && isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Uwierzytelnianie...</span>
      </div>
    );
  }

  return null;
}
