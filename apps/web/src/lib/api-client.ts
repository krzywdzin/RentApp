const API_BASE = '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
  ) {
    super(`API Error ${status}`);
  }
}

// Token refresh state management
let refreshPromise: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}

async function handleTokenRefresh(): Promise<boolean> {
  // If a refresh is already in-flight, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = refreshToken().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function apiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    const refreshed = await handleTokenRefresh();

    if (!refreshed) {
      // Refresh failed -- redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new ApiError(401, { message: 'Sesja wygasla' });
    }

    // Retry the original request with fresh token
    const retryRes = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    });

    if (!retryRes.ok) {
      const data = await retryRes.json().catch(() => ({}));
      throw new ApiError(retryRes.status, data);
    }

    if (retryRes.status === 204 || retryRes.headers.get('content-length') === '0') {
      return undefined as T;
    }
    return retryRes.json();
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return res.json();
}
