import type {
  RentalDto,
  CalendarResponse,
  CreateRentalInput,
  ReturnRentalInput,
  ExtendRentalInput,
} from '@rentapp/shared';
import apiClient from './client';

export interface RentalWithRelations extends RentalDto {
  vehicle: {
    id: string;
    registration: string;
    make: string;
    model: string;
    year: number;
    mileage: number;
    status: string;
    vehicleClass?: { id: string; name: string } | null;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
  };
}

export const rentalsApi = {
  getRentals: async (params?: {
    status?: string;
  }): Promise<RentalWithRelations[]> => {
    const { data } = await apiClient.get<{ data: RentalWithRelations[]; total: number; page: number; limit: number }>('/rentals', {
      params,
    });
    return data.data;
  },

  getRental: async (id: string): Promise<RentalWithRelations> => {
    const { data } = await apiClient.get<RentalWithRelations>(
      `/rentals/${id}`,
    );
    return data;
  },

  createRental: async (input: CreateRentalInput): Promise<RentalDto> => {
    const { data } = await apiClient.post<RentalDto>('/rentals', input);
    return data;
  },

  returnRental: async (
    id: string,
    input: ReturnRentalInput,
  ): Promise<RentalDto> => {
    const { data } = await apiClient.patch<RentalDto>(
      `/rentals/${id}/return`,
      input,
    );
    return data;
  },

  extendRental: async (
    id: string,
    input: ExtendRentalInput,
  ): Promise<RentalDto> => {
    const { data } = await apiClient.patch<RentalDto>(
      `/rentals/${id}/extend`,
      input,
    );
    return data;
  },

  getCalendar: async (
    start: string,
    end: string,
  ): Promise<CalendarResponse> => {
    const { data } = await apiClient.get<CalendarResponse>(
      '/rentals/calendar',
      {
        params: { from: start, to: end },
      },
    );
    return data;
  },
};
