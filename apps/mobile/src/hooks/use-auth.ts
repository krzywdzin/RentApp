import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { SECURE_STORE_KEYS } from '@/lib/constants';

async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = await SecureStore.getItemAsync(SECURE_STORE_KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = Crypto.randomUUID();
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

export function useLogin() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const deviceId = await getOrCreateDeviceId();
      const tokens = await authApi.login(email, password, deviceId);

      // Store tokens in SecureStore
      await SecureStore.setItemAsync(
        SECURE_STORE_KEYS.ACCESS_TOKEN,
        tokens.accessToken,
      );
      await SecureStore.setItemAsync(
        SECURE_STORE_KEYS.REFRESH_TOKEN,
        tokens.refreshToken,
      );
      if (tokens.deviceId) {
        await SecureStore.setItemAsync(
          SECURE_STORE_KEYS.DEVICE_ID,
          tokens.deviceId,
        );
      }

      // Fetch user profile
      const user = await authApi.getMe();
      return user;
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const deviceId = await SecureStore.getItemAsync(
        SECURE_STORE_KEYS.DEVICE_ID,
      );
      if (deviceId) {
        await authApi.logout(deviceId).catch(() => {
          // Best-effort server logout
        });
      }
    },
    onSettled: async () => {
      await logout();
      queryClient.clear();
    },
  });
}

export function useMe() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    enabled: isAuthenticated,
  });
}
