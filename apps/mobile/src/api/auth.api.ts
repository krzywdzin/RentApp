import type { TokenPairDto, UserDto } from '@rentapp/shared';
import apiClient from './client';

export const authApi = {
  login: async (
    email: string,
    password: string,
    deviceId: string,
  ): Promise<TokenPairDto> => {
    const { data } = await apiClient.post<TokenPairDto>('/auth/login', {
      email,
      password,
      deviceId,
    });
    return data;
  },

  refresh: async (
    refreshToken: string,
    deviceId: string,
  ): Promise<TokenPairDto> => {
    const { data } = await apiClient.post<TokenPairDto>('/auth/refresh', {
      refreshToken,
      deviceId,
    });
    return data;
  },

  logout: async (deviceId: string): Promise<void> => {
    await apiClient.post('/auth/logout', { deviceId });
  },

  getMe: async (): Promise<UserDto> => {
    const { data } = await apiClient.get<UserDto>('/users/me');
    return data;
  },
};
