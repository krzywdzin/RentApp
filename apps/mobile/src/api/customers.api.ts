import type {
  CustomerDto,
  CustomerSearchResultDto,
  CreateCustomerInput,
} from '@rentapp/shared';
import apiClient from './client';

export const customersApi = {
  searchCustomers: async (
    query: string,
  ): Promise<CustomerSearchResultDto[]> => {
    const { data } = await apiClient.get<CustomerSearchResultDto[]>(
      '/customers/search',
      {
        params: { lastName: query },
      },
    );
    return data;
  },

  getCustomer: async (id: string): Promise<CustomerDto> => {
    const { data } = await apiClient.get<CustomerDto>(`/customers/${id}`);
    return data;
  },

  createCustomer: async (input: CreateCustomerInput): Promise<CustomerDto> => {
    const { data } = await apiClient.post<CustomerDto>('/customers', input);
    return data;
  },
};
