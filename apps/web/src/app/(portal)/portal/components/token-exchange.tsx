'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePortalAuth } from '@/hooks/use-portal-auth';

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
      <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-center">
        <p className="font-body text-destructive">{error}</p>
      </div>
    );
  }

  if (hasTokenParams && isLoading) {
    return (
      <div className="bg-card shadow-inner-soft border border-sand rounded-md p-8 flex items-center justify-center gap-2">
        <div className="h-8 w-8 rounded-md bg-sand animate-pulse" />
        <div className="space-y-2 flex-1 max-w-[200px]">
          <div className="h-3 rounded bg-sand animate-pulse" />
          <div className="h-3 rounded bg-sand animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  return null;
}
