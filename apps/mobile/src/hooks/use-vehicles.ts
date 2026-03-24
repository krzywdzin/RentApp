import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '@/api/vehicles.api';

export const vehicleKeys = {
  all: ['vehicles'] as const,
  lists: () => [...vehicleKeys.all, 'list'] as const,
  list: (filters?: { status?: string }) =>
    [...vehicleKeys.lists(), filters] as const,
  details: () => [...vehicleKeys.all, 'detail'] as const,
  detail: (id: string) => [...vehicleKeys.details(), id] as const,
};

export function useVehicles(filters?: { status?: string }) {
  return useQuery({
    queryKey: vehicleKeys.list(filters),
    queryFn: () => vehiclesApi.getVehicles(filters),
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: () => vehiclesApi.getVehicle(id),
    enabled: !!id,
  });
}
