import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CustomerDto, CustomerSearchResultDto } from '@rentapp/shared';

export const customerKeys = {
  all: ['customers'] as const,
  list: (filters?: Record<string, unknown>) => [...customerKeys.all, 'list', filters] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const,
  search: (query: string) => [...customerKeys.all, 'search', query] as const,
};

export function useCustomers() {
  return useQuery({
    queryKey: customerKeys.list(),
    queryFn: () => apiClient<CustomerDto[]>('/customers'),
  });
}

export function useSearchCustomers(query: string) {
  return useQuery({
    queryKey: customerKeys.search(query),
    queryFn: () =>
      apiClient<CustomerSearchResultDto[]>(`/customers/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
  });
}
