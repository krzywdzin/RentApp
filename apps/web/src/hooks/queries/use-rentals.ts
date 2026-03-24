import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { RentalDto } from '@rentapp/shared';

export const rentalKeys = {
  all: ['rentals'] as const,
  list: (filters?: Record<string, unknown>) => [...rentalKeys.all, 'list', filters] as const,
  detail: (id: string) => [...rentalKeys.all, 'detail', id] as const,
};

export function useRentals() {
  return useQuery({
    queryKey: rentalKeys.list(),
    queryFn: () => apiClient<RentalDto[]>('/rentals'),
  });
}
