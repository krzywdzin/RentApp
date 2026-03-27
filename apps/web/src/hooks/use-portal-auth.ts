'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PortalCustomerInfo } from '@rentapp/shared';

const PORTAL_AUTH_KEY = ['portal', 'auth'] as const;

async function fetchPortalAuth(): Promise<PortalCustomerInfo | null> {
  const res = await fetch('/api/portal/me');
  if (!res.ok) return null;
  return res.json();
}

export function usePortalAuth() {
  const queryClient = useQueryClient();
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: PORTAL_AUTH_KEY,
    queryFn: fetchPortalAuth,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const exchangeToken = useCallback(
    async (token: string, customerId: string) => {
      setExchangeError(null);
      try {
        const res = await fetch('/api/portal/auth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, customerId }),
        });

        if (!res.ok) {
          await res.json().catch(() => ({}));
          const errorMsg =
            res.status === 401
              ? 'Link wygasl. Skontaktuj sie z wypozyczalnia.'
              : 'Nieprawidlowy link.';
          setExchangeError(errorMsg);
          return false;
        }

        await queryClient.invalidateQueries({ queryKey: PORTAL_AUTH_KEY });
        return true;
      } catch {
        setExchangeError('Wystapil blad. Sprobuj ponownie.');
        return false;
      }
    },
    [queryClient],
  );

  const refreshAuth = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: PORTAL_AUTH_KEY });
  }, [queryClient]);

  const customerName = user ? `${user.firstName} ${user.lastName}` : null;

  return {
    isAuthenticated: !!user,
    isLoading,
    customerName,
    error: exchangeError,
    exchangeToken,
    refreshAuth,
  };
}
