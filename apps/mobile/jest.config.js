module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./src/test/setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|@rentapp/shared|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-svg|react-native-toast-message|react-native-webview|react-native-signature-canvas|lucide-react-native|@gorhom/bottom-sheet|@tanstack/react-query|zustand|i18next|react-i18next|@hookform/resolvers|react-hook-form)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@rentapp/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
};
