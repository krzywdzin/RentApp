import type { VehicleDto } from '@rentapp/shared';
import apiClient from './client';

export const vehiclesApi = {
  getVehicles: async (params?: {
    status?: string;
  }): Promise<VehicleDto[]> => {
    const { data } = await apiClient.get<VehicleDto[]>('/vehicles', {
      params,
    });
    return data;
  },

  getVehicle: async (id: string): Promise<VehicleDto> => {
    const { data } = await apiClient.get<VehicleDto>(`/vehicles/${id}`);
    return data;
  },
};
