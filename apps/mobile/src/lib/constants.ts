import Constants from 'expo-constants';

export const API_URL =
  Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3000';

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
