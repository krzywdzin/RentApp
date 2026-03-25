module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./src/test/setup.js'],
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|@rentapp/shared|lucide-react-native|@gorhom/bottom-sheet|@tanstack/react-query|zustand|i18next|react-i18next|@hookform/resolvers|react-hook-form|react-native-toast-message|react-native-signature-canvas))',
    '/node_modules/react-native-reanimated/plugin/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@rentapp/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
};
