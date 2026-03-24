import type {
  ContractDto,
  CreateContractInput,
  SignContractInput,
} from '@rentapp/shared';
import apiClient from './client';

export const contractsApi = {
  create: async (input: CreateContractInput): Promise<ContractDto> => {
    const { data } = await apiClient.post<ContractDto>('/contracts', input);
    return data;
  },

  signContract: async (
    contractId: string,
    input: SignContractInput,
  ): Promise<ContractDto> => {
    const { data } = await apiClient.post<ContractDto>(
      `/contracts/${contractId}/sign`,
      input,
    );
    return data;
  },

  getById: async (id: string): Promise<ContractDto> => {
    const { data } = await apiClient.get<ContractDto>(`/contracts/${id}`);
    return data;
  },

  getByRental: async (rentalId: string): Promise<ContractDto> => {
    const { data } = await apiClient.get<ContractDto>(
      `/contracts/rental/${rentalId}`,
    );
    return data;
  },

  getPdfUrl: (contractId: string): string => {
    return `${apiClient.defaults.baseURL}/contracts/${contractId}/pdf`;
  },
};
