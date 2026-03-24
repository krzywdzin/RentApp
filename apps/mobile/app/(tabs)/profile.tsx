import React, { useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/use-auth';
import { APP_VERSION } from '@/lib/constants';
import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useAuthStore((s) => s.setBiometricEnabled);
  const logoutMutation = useLogout();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Toast.show({
          type: 'error',
          text1: t('errors.biometricFailed'),
        });
        return;
      }
    }

    await setBiometricEnabled(value);
  };

  const handleLogout = () => {
    setShowLogoutDialog(false);
    logoutMutation.mutate();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Header */}
        <Text className="mb-4 text-[20px] font-semibold text-zinc-900">
          {t('nav.profile')}
        </Text>

        {/* User Info */}
        <AppCard className="mb-4">
          <Text className="text-lg font-semibold text-zinc-900">
            {user?.name ?? ''}
          </Text>
          <Text className="mt-1 text-base text-zinc-500">
            {user?.email ?? ''}
          </Text>
          <View className="mt-2">
            <StatusBadge status={user?.role ?? 'EMPLOYEE'} />
          </View>
        </AppCard>

        {/* Biometric Toggle */}
        <AppCard className="mb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base text-zinc-900">
              Logowanie biometryczne
            </Text>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: '#E4E4E7', true: '#2563EB' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </AppCard>

        {/* App Version */}
        <AppCard className="mb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base text-zinc-900">Wersja aplikacji</Text>
            <Text className="text-base text-zinc-500">{APP_VERSION}</Text>
          </View>
        </AppCard>

        {/* Logout */}
        <View className="mt-4 mb-8">
          <AppButton
            title={t('confirm.logout')}
            variant="destructive"
            onPress={() => setShowLogoutDialog(true)}
            loading={logoutMutation.isPending}
            fullWidth
          />
        </View>
      </ScrollView>

      <ConfirmationDialog
        visible={showLogoutDialog}
        title={t('confirm.logoutTitle')}
        body={t('confirm.logoutBody')}
        confirmLabel={t('confirm.logout')}
        cancelLabel={t('confirm.stay')}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutDialog(false)}
        variant="destructive"
      />
    </SafeAreaView>
  );
}
