import Constants from 'expo-constants';

// Production Railway API URL - hardcoded as bulletproof fallback
const RAILWAY_API_URL = 'https://api-production-977b.up.railway.app';

// API URL resolution order:
// 1. EXPO_PUBLIC_API_URL env var (embedded by Metro at build time)
// 2. Constants.expoConfig.extra.apiUrl (from app.config.ts)
// 3. Railway URL as fallback (NEVER localhost in production builds)
const resolveApiUrl = (): string => {
  // Metro embeds EXPO_PUBLIC_* vars at build time - most reliable source
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  // Try expo-constants (may be undefined in EAS builds)
  const extraUrl = Constants.expoConfig?.extra?.apiUrl;
  if (extraUrl) {
    return extraUrl;
  }

  // Fallback to Railway URL - localhost is never acceptable in production
  return RAILWAY_API_URL;
};

export const API_URL = resolveApiUrl();

// Log API URL on startup for debugging (only in development or when debugging builds)
if (__DEV__) {
  console.log('[constants] API_URL resolved to:', API_URL);
  console.log('[constants] Source: process.env.EXPO_PUBLIC_API_URL =', process.env.EXPO_PUBLIC_API_URL);
  console.log('[constants] Source: Constants.expoConfig?.extra?.apiUrl =', Constants.expoConfig?.extra?.apiUrl);
}

export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export const RENTAL_STATUS_COLORS: Record<string, string> = {
  DRAFT: '#D4D4D8', // zinc-300
  ACTIVE: '#16A34A', // green-600
  EXTENDED: '#F59E0B', // amber-500
  RETURNED: '#71717A', // zinc-500
};

export const CHECKLIST_ITEMS = [
  { key: 'bodywork', label: 'Karoseria' },
  { key: 'interior', label: 'Wnętrze' },
  { key: 'tires', label: 'Opony' },
  { key: 'lights', label: 'Oświetlenie' },
  { key: 'documents', label: 'Dokumenty' },
  { key: 'accessories', label: 'Akcesoria' },
  { key: 'cleanliness', label: 'Czystość' },
  { key: 'fuel', label: 'Paliwo' },
] as const;

export const RENTAL_WIZARD_LABELS: string[] = ['Klient', 'Pojazd', 'Daty', 'Umowa', 'Zdjęcia', 'Podpisy'];
export const DEFAULT_VAT_RATE = 23;
export const VAT_MULTIPLIER = 1 + DEFAULT_VAT_RATE / 100; // 1.23
export const ONE_DAY_MS = 86_400_000;
export const UPCOMING_RETURN_THRESHOLD_DAYS = 3;

export const SECURE_STORE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  DEVICE_ID: 'device_id',
} as const;
