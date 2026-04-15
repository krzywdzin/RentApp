import { ExpoConfig, ConfigContext } from 'expo/config';

// Production Railway API URL - hardcoded as bulletproof fallback
const RAILWAY_API_URL = 'https://api-production-977b.up.railway.app';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  owner: 'krzywdzinek',
  name: 'KITEK Rental',
  slug: 'kitek-rental',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'kitek-rental',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#2563EB',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'pl.kitek.rental',
    infoPlist: {
      NSFaceIDUsageDescription:
        'Uzywamy Face ID do szybkiego logowania',
    },
  },
  android: {
    package: 'pl.kitek.rental',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#2563EB',
    },
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-local-authentication',
    'expo-screen-orientation',
    '@react-native-community/datetimepicker',
    '@sentry/react-native',
    'expo-localization',
  ],
  extra: {
    // API URL with Railway as fallback - never localhost
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? RAILWAY_API_URL,
    eas: {
      projectId: '45d87130-6df0-42eb-b0a9-8d2a30b81341',
    },
  },
});
