import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateRentalInput, ReturnRentalInput, ExtendRentalInput } from '@rentapp/shared';
import { rentalsApi } from '@/api/rentals.api';
import apiClient from '@/api/client';

export const rentalKeys = {
  all: ['rentals'] as const,
  lists: () => [...rentalKeys.all, 'list'] as const,
  list: (filters?: { status?: string }) =>
    [...rentalKeys.lists(), filters] as const,
  details: () => [...rentalKeys.all, 'detail'] as const,
  detail: (id: string) => [...rentalKeys.details(), id] as const,
};

export function useRentals(filters?: { status?: string }) {
  return useQuery({
    queryKey: rentalKeys.list(filters),
    queryFn: () => rentalsApi.getRentals(filters),
  });
}

export function useRental(id: string) {
  return useQuery({
    queryKey: rentalKeys.detail(id),
    queryFn: () => rentalsApi.getRental(id),
    enabled: !!id,
  });
}

export function useCreateRental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRentalInput) => rentalsApi.createRental(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.all });
    },
  });
}

export function useReturnRental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReturnRentalInput }) =>
      rentalsApi.returnRental(id, data),
    retry: 2,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.all });
    },
  });
}

export function useCreateReturnProtocol() {
  return useMutation({
    mutationFn: (data: {
      rentalId: string;
      cleanliness: string;
      cleanlinessNote?: string;
      otherNotes?: string;
      customerSignatureBase64: string;
      workerSignatureBase64: string;
    }) => apiClient.post('/return-protocols', data).then((res) => res.data),
  });
}

export function useExtendRental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExtendRentalInput }) =>
      rentalsApi.extendRental(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.all });
    },
  });
}
