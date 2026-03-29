import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ContractDto } from '@rentapp/shared';

export const contractKeys = {
  all: ['contracts'] as const,
  list: () => [...contractKeys.all, 'list'] as const,
  detail: (id: string) => [...contractKeys.all, 'detail', id] as const,
  byRental: (rentalId: string) => [...contractKeys.all, 'byRental', rentalId] as const,
};

export function useContracts() {
  return useQuery({
    queryKey: contractKeys.list(),
    queryFn: async () => {
      const res = await apiClient<{ data: ContractDto[]; total: number; page: number; limit: number }>('/contracts');
      return res.data;
    },
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => apiClient<ContractDto>(`/contracts/${id}`),
    enabled: !!id,
  });
}

export function useContractByRental(rentalId: string) {
  return useQuery({
    queryKey: contractKeys.byRental(rentalId),
    queryFn: () => apiClient<ContractDto>(`/contracts/rental/${rentalId}`),
    enabled: !!rentalId,
  });
}

export function getContractPdfUrl(id: string): string {
  return `/api/contracts/${id}/pdf`;
}
