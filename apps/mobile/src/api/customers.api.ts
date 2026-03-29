import type {
  CustomerDto,
  CustomerSearchResultDto,
  CreateCustomerInput,
} from '@rentapp/shared';
import apiClient from './client';

/**
 * Detect search query type based on input pattern.
 * - 11 digits (with optional spaces/dashes) → PESEL
 * - Starts with +48 / digit-heavy string with optional separators → phone
 * - Otherwise → lastName
 */
export function detectSearchParam(
  query: string,
): { lastName?: string; phone?: string; pesel?: string } {
  const trimmed = query.trim();
  const digitsOnly = trimmed.replace(/[\s\-()]/g, '');

  // PESEL: exactly 11 digits
  if (/^\d{11}$/.test(digitsOnly)) {
    return { pesel: digitsOnly };
  }

  // Phone: starts with +48 or 0, or is 9+ digits (Polish mobile/landline)
  if (
    /^\+/.test(trimmed) ||
    (digitsOnly.length >= 9 && /^\d+$/.test(digitsOnly))
  ) {
    return { phone: trimmed };
  }

  return { lastName: trimmed };
}

export const customersApi = {
  searchCustomers: async (
    query: string,
  ): Promise<CustomerSearchResultDto[]> => {
    const { data } = await apiClient.get<CustomerSearchResultDto[]>(
      '/customers/search',
      {
        params: detectSearchParam(query),
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
