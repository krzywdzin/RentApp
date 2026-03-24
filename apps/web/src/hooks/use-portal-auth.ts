'use client';

import { useState, useCallback, useEffect } from 'react';
import type { PortalCustomerInfo } from '@rentapp/shared';

interface PortalAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  customerName: string | null;
  error: string | null;
}

export function usePortalAuth() {
  const [state, setState] = useState<PortalAuthState>({
    isAuthenticated: false,
    isLoading: true,
    customerName: null,
    error: null,
  });

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/portal/me');
      if (!res.ok) {
        setState({ isAuthenticated: false, isLoading: false, customerName: null, error: null });
        return;
      }
      const data: PortalCustomerInfo = await res.json();
      setState({
        isAuthenticated: true,
        isLoading: false,
        customerName: `${data.firstName} ${data.lastName}`,
        error: null,
      });
    } catch {
      setState({ isAuthenticated: false, isLoading: false, customerName: null, error: null });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const exchangeToken = useCallback(
    async (token: string, customerId: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
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
          setState({
            isAuthenticated: false,
            isLoading: false,
            customerName: null,
            error: errorMsg,
          });
          return false;
        }

        await checkAuth();
        return true;
      } catch {
        setState({
          isAuthenticated: false,
          isLoading: false,
          customerName: null,
          error: 'Wystapil blad. Sprobuj ponownie.',
        });
        return false;
      }
    },
    [checkAuth],
  );

  return { ...state, exchangeToken, refreshAuth: checkAuth };
}
