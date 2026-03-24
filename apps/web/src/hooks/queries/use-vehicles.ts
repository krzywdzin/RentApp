import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { VehicleDto } from '@rentapp/shared';

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
