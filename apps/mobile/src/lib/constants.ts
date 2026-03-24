import Constants from 'expo-constants';

export const API_URL =
  Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3000';

export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export const RENTAL_STATUS_COLORS: Record<string, string> = {
  DRAFT: '#D4D4D8', // zinc-300
  ACTIVE: '#16A34A', // green-600
  EXTENDED: '#F59E0B', // amber-500
  RETURNED: '#71717A', // zinc-500
  CANCELLED: '#DC2626', // red-600
};

export const CHECKLIST_ITEMS = [
  { key: 'bodywork', label: 'Karoseria' },
  { key: 'interior', label: 'Wnetrze' },
  { key: 'tires', label: 'Opony' },
  { key: 'lights', label: 'Oswietlenie' },
  { key: 'documents', label: 'Dokumenty' },
  { key: 'accessories', label: 'Akcesoria' },
  { key: 'cleanliness', label: 'Czystosc' },
  { key: 'fuel', label: 'Paliwo' },
] as const;

export const SECURE_STORE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  DEVICE_ID: 'device_id',
} as const;
