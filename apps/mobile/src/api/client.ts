import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { API_URL, SECURE_STORE_KEYS } from '@/lib/constants';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Token refresh queue pattern ---

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

// --- Request interceptor: attach Bearer token ---

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const accessToken = await SecureStore.getItemAsync(
      SECURE_STORE_KEYS.ACCESS_TOKEN,
    );
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// --- Response interceptor: handle 401 with token refresh ---

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401, not on login/refresh endpoints
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until refresh completes
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync(
        SECURE_STORE_KEYS.REFRESH_TOKEN,
      );
      const deviceId = await SecureStore.getItemAsync(
        SECURE_STORE_KEYS.DEVICE_ID,
      );
      const accessToken = await SecureStore.getItemAsync(
        SECURE_STORE_KEYS.ACCESS_TOKEN,
      );

      if (!refreshToken || !deviceId) {
        throw new Error('No refresh token or device ID');
      }

      const { data } = await axios.post(
        `${API_URL}/auth/refresh`,
        { refreshToken, deviceId },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      await SecureStore.setItemAsync(
        SECURE_STORE_KEYS.ACCESS_TOKEN,
        data.accessToken,
      );
      await SecureStore.setItemAsync(
        SECURE_STORE_KEYS.REFRESH_TOKEN,
        data.refreshToken,
      );
      if (data.deviceId) {
        await SecureStore.setItemAsync(
          SECURE_STORE_KEYS.DEVICE_ID,
          data.deviceId,
        );
      }

      processQueue(null, data.accessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      // Clear stored tokens and redirect to login
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.DEVICE_ID);

      router.replace('/login');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
