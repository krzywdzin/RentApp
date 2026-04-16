import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAxiosError } from 'axios';
import type { UserDto } from '@rentapp/shared';
import { SECURE_STORE_KEYS } from '@/lib/constants';
import { authApi } from '@/api/auth.api';

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricEnabled: boolean;
  setUser: (user: UserDto | null) => void;
  setAuthenticated: (value: boolean) => void;
  setBiometricEnabled: (value: boolean) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

const BIOMETRIC_KEY = 'biometric_enabled';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  biometricEnabled: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setAuthenticated: (value) => set({ isAuthenticated: value }),

  setBiometricEnabled: async (value) => {
    await AsyncStorage.setItem(BIOMETRIC_KEY, JSON.stringify(value));
    set({ biometricEnabled: value });
  },

  logout: async () => {
    try {
      const deviceId = await SecureStore.getItemAsync(
        SECURE_STORE_KEYS.DEVICE_ID,
      );
      if (deviceId) {
        await authApi.logout(deviceId).catch(() => {
          // Best-effort logout, ignore network errors
        });
      }
    } finally {
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.DEVICE_ID);
      set({ user: null, isAuthenticated: false });
    }
  },

  initialize: async () => {
    try {
      set({ isLoading: true });

      // Load biometric preference
      const biometricStr = await AsyncStorage.getItem(BIOMETRIC_KEY);
      const biometricEnabled = biometricStr ? JSON.parse(biometricStr) : false;

      // Check for existing tokens
      const accessToken = await SecureStore.getItemAsync(
        SECURE_STORE_KEYS.ACCESS_TOKEN,
      );

      if (!accessToken) {
        set({ isLoading: false, biometricEnabled });
        return;
      }

      // Validate token by fetching user profile
      const user = await authApi.getMe();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        biometricEnabled,
      });
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        // Token invalid or expired, clear state
        await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
        await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
        set({ user: null, isAuthenticated: false, isLoading: false });
      } else {
        // Network error, timeout, 500, etc. -- keep session alive with stale data
        if (__DEV__) console.warn('Auth initialize failed (non-401), keeping session:', error);
        set({ isLoading: false });
      }
    }
  },
}));
