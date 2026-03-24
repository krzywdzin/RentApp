import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateContractInput, SignContractInput } from '@rentapp/shared';
import { contractsApi } from '@/api/contracts.api';

export const contractKeys = {
  all: ['contracts'] as const,
  details: () => [...contractKeys.all, 'detail'] as const,
  detail: (id: string) => [...contractKeys.details(), id] as const,
  byRental: (rentalId: string) =>
    [...contractKeys.all, 'rental', rentalId] as const,
};

export function useContract(id: string) {
  return useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => contractsApi.getById(id),
    enabled: !!id,
  });
}

export function useContractByRental(rentalId: string) {
  return useQuery({
    queryKey: contractKeys.byRental(rentalId),
    queryFn: () => contractsApi.getByRental(rentalId),
    enabled: !!rentalId,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContractInput) => contractsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}

export function useSignContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contractId,
      data,
    }: {
      contractId: string;
      data: SignContractInput;
    }) => contractsApi.signContract(contractId, data),
    onSuccess: (contract) => {
      queryClient.invalidateQueries({
        queryKey: contractKeys.detail(contract.id),
      });
    },
  });
}
