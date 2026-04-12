import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';
import { toast } from 'sonner';
import type { VehicleClassDto } from '@rentapp/shared';

export const vehicleClassKeys = {
  all: ['vehicle-classes'] as const,
  list: () => [...vehicleClassKeys.all, 'list'] as const,
};

export function useVehicleClasses() {
  return useQuery({
    queryKey: vehicleClassKeys.list(),
    queryFn: () => apiClient<VehicleClassDto[]>('/vehicle-classes'),
  });
}

export function useCreateVehicleClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      apiClient<VehicleClassDto>('/vehicle-classes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleClassKeys.all });
      toast.success('Klasa dodana');
    },
    onError: () => {
      toast.error('Wystapil blad podczas dodawania klasy');
    },
  });
}

export function useUpdateVehicleClass(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      apiClient<VehicleClassDto>(`/vehicle-classes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleClassKeys.all });
      toast.success('Nazwa zmieniona');
    },
    onError: () => {
      toast.error('Wystapil blad podczas zmiany nazwy');
    },
  });
}

export function useDeleteVehicleClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<void>(`/vehicle-classes/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleClassKeys.all });
      toast.success('Klasa usunieta');
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(
          'Nie mozna usunac klasy przypisanej do pojazdow. Najpierw zmien klase tych pojazdow.',
        );
      } else {
        toast.error('Wystapil blad podczas usuwania klasy');
      }
    },
  });
}
