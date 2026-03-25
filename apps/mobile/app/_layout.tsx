// NativeWind disabled for SDK 54 compatibility — styles degrade gracefully
// import '../global.css';
import '../src/i18n';

import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot } from 'expo-router';
import Toast from 'react-native-toast-message';

import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <AuthProvider>
            <Slot />
          </AuthProvider>
        </QueryProvider>
      </SafeAreaProvider>
      <Toast />
    </GestureHandlerRootView>
  );
}
