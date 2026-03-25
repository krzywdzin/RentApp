import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
  VehicleDto,
  VehicleStatus,
  CreateVehicleInput,
  UpdateVehicleInput,
} from '@rentapp/shared';

export const vehicleKeys = {
  all: ['vehicles'] as const,
  list: (filters?: Record<string, unknown>) => [...vehicleKeys.all, 'list', filters] as const,
  detail: (id: string) => [...vehicleKeys.all, 'detail', id] as const,
};

export function useVehicles() {
  return useQuery({
    queryKey: vehicleKeys.list(),
    queryFn: () => apiClient<VehicleDto[]>('/vehicles'),
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: () => apiClient<VehicleDto>(`/vehicles/${id}`),
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVehicleInput) =>
      apiClient<VehicleDto>('/vehicles', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
      toast.success('Pojazd dodany pomyslnie');
    },
    onError: () => {
      toast.error('Wystapil blad podczas dodawania pojazdu');
    },
  });
}

export function useUpdateVehicle(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateVehicleInput) =>
      apiClient<VehicleDto>(`/vehicles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
      queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(id) });
      toast.success('Zmiany zapisane');
    },
    onError: () => {
      toast.error('Wystapil blad podczas zapisywania zmian');
    },
  });
}

export function useArchiveVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<VehicleDto>(`/vehicles/${id}/archive`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
      toast.success('Pojazd usuniety');
    },
    onError: () => {
      toast.error('Wystapil blad podczas usuwania pojazdu');
    },
  });
}

export function useBulkUpdateVehicles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: VehicleStatus }) => {
      const results = await Promise.all(
        ids.map((id) =>
          apiClient<VehicleDto>(`/vehicles/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
          }),
        ),
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
      toast.success('Status pojazdow zmieniony');
    },
    onError: () => {
      toast.error('Wystapil blad podczas zmiany statusu');
    },
  });
}
