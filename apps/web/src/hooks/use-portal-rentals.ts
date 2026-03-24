'use client';

import { useQuery } from '@tanstack/react-query';
import type { PortalRentalDto } from '@rentapp/shared';

const PORTAL_API = '/api/portal';

async function portalFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${PORTAL_API}${path}`);
  if (!res.ok) {
    throw new Error(res.status === 401 ? 'Sesja wygasla' : 'Wystapil blad');
  }
  return res.json();
}

export const portalRentalKeys = {
  all: ['portal-rentals'] as const,
  list: () => [...portalRentalKeys.all, 'list'] as const,
  detail: (id: string) => [...portalRentalKeys.all, 'detail', id] as const,
};

export function usePortalRentals() {
  return useQuery({
    queryKey: portalRentalKeys.list(),
    queryFn: () => portalFetch<PortalRentalDto[]>('/rentals'),
  });
}

export function usePortalRental(rentalId: string) {
  return useQuery({
    queryKey: portalRentalKeys.detail(rentalId),
    queryFn: () => portalFetch<PortalRentalDto>(`/rentals/${rentalId}`),
    enabled: !!rentalId,
  });
}
