import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
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
    [
      '@sentry/react-native/expo',
      {
        organization: 'kitek',
        project: 'mobile',
      },
    ],
  ],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
    eas: {
      projectId: 'kitek-rental',
    },
  },
});
