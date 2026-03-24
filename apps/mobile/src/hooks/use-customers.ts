import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateCustomerInput } from '@rentapp/shared';
import { customersApi } from '@/api/customers.api';

export const customerKeys = {
  all: ['customers'] as const,
  searches: () => [...customerKeys.all, 'search'] as const,
  search: (query: string) => [...customerKeys.searches(), query] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

export function useCustomerSearch(query: string) {
  return useQuery({
    queryKey: customerKeys.search(query),
    queryFn: () => customersApi.searchCustomers(query),
    enabled: query.length >= 2,
    placeholderData: (previousData) => previousData,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersApi.getCustomer(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerInput) =>
      customersApi.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}
