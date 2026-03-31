import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
  CustomerDto,
  CustomerSearchResultDto,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '@rentapp/shared';

export const customerKeys = {
  all: ['customers'] as const,
  list: (filters?: Record<string, unknown>) => [...customerKeys.all, 'list', filters] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const,
  search: (query: string) => [...customerKeys.all, 'search', query] as const,
};

export function useCustomers() {
  return useQuery({
    queryKey: customerKeys.list(),
    queryFn: async () => {
      const res = await apiClient<{
        data: CustomerDto[];
        total: number;
        page: number;
        limit: number;
      }>('/customers');
      return res.data;
    },
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => apiClient<CustomerDto>(`/customers/${id}`),
    enabled: !!id,
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

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCustomerInput) =>
      apiClient<CustomerDto>('/customers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast.success('Klient dodany pomyslnie');
    },
    onError: () => {
      toast.error('Wystapil blad podczas dodawania klienta');
    },
  });
}

export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCustomerInput) =>
      apiClient<CustomerDto>(`/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
      toast.success('Zmiany zapisane');
    },
    onError: () => {
      toast.error('Wystapil blad podczas zapisywania zmian');
    },
  });
}

export function useArchiveCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<CustomerDto>(`/customers/${id}/archive`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast.success('Klient usuniety');
    },
    onError: () => {
      toast.error('Wystapil blad podczas usuwania klienta');
    },
  });
}
