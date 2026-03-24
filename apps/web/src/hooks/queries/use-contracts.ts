import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ContractDto, RentalDto } from '@rentapp/shared';

export const contractKeys = {
  all: ['contracts'] as const,
  list: () => [...contractKeys.all, 'list'] as const,
  detail: (id: string) => [...contractKeys.all, 'detail', id] as const,
  byRental: (rentalId: string) => [...contractKeys.all, 'byRental', rentalId] as const,
};

// Since there is no GET /contracts list endpoint, we derive contracts
// from rentals by fetching each rental's contract.
// This uses the rental list + per-rental contract lookup.
export function useContracts() {
  return useQuery({
    queryKey: contractKeys.list(),
    queryFn: async () => {
      const rentals = await apiClient<RentalDto[]>('/rentals');
      const contracts: ContractDto[] = [];
      // Fetch contracts for each rental in parallel
      const results = await Promise.allSettled(
        rentals.map((r) => apiClient<ContractDto>(`/contracts/rental/${r.id}`)),
      );
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          contracts.push(result.value);
        }
      }
      return contracts;
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
