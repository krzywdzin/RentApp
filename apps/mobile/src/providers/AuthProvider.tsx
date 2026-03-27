import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { router, useSegments, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';

interface AuthContextValue {
  isReady: boolean;
}

const AuthContext = createContext<AuthContextValue>({ isReady: false });

export function useAuthContext() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const {
    isAuthenticated,
    isLoading,
    biometricEnabled,
    initialize,
  } = useAuthStore();

  const [biometricChecked, setBiometricChecked] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  // Initialize auth state on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Biometric prompt after auth initialization
  useEffect(() => {
    if (isLoading || biometricChecked) return;

    if (isAuthenticated && biometricEnabled) {
      LocalAuthentication.authenticateAsync({
        promptMessage: 'Zaloguj sie biometrycznie',
        fallbackLabel: 'Uzyj hasla',
        cancelLabel: 'Anuluj',
      }).then(async (result) => {
        if (!result.success) {
          // Biometric failed — await logout to ensure tokens are cleared before isReady
          await useAuthStore.getState().logout();
        }
        setBiometricChecked(true);
        setIsReady(true);
      });
    } else {
      setBiometricChecked(true);
      setIsReady(true);
    }
  }, [isLoading, isAuthenticated, biometricEnabled, biometricChecked]);

  // Navigation guard: redirect based on auth state
  useEffect(() => {
    if (!navigationState?.key || isLoading || !isReady) return;

    const inAuthGroup = segments[0] === 'login';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isAuthenticated, segments, navigationState?.key, isLoading, isReady]);

  // Show loading spinner while initializing
  if (isLoading || !isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ isReady }}>
      {children}
    </AuthContext.Provider>
  );
}
