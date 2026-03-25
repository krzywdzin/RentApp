import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
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
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <ScrollView style={s.scroll}>
        {/* Header */}
        <Text style={s.pageTitle}>{t('nav.profile')}</Text>

        {/* User Info */}
        <AppCard cardStyle={s.mb16}>
          <Text style={s.userName}>{user?.name ?? ''}</Text>
          <Text style={s.userEmail}>{user?.email ?? ''}</Text>
          <View style={s.mt8}>
            <StatusBadge status={user?.role ?? 'EMPLOYEE'} />
          </View>
        </AppCard>

        {/* Biometric Toggle */}
        <AppCard cardStyle={s.mb16}>
          <View style={s.settingsRow}>
            <Text style={s.settingsLabel}>Logowanie biometryczne</Text>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: '#E4E4E7', true: '#2563EB' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </AppCard>

        {/* App Version */}
        <AppCard cardStyle={s.mb16}>
          <View style={s.settingsRow}>
            <Text style={s.settingsLabel}>Wersja aplikacji</Text>
            <Text style={s.versionText}>{APP_VERSION}</Text>
          </View>
        </AppCard>

        {/* Logout */}
        <View style={s.logoutWrap}>
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

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  pageTitle: { marginBottom: 16, fontSize: 20, fontWeight: '600', color: '#18181B' },
  mb16: { marginBottom: 16 },
  mt8: { marginTop: 8 },
  userName: { fontSize: 18, fontWeight: '600', color: '#18181B' },
  userEmail: { marginTop: 4, fontSize: 16, color: '#71717A' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingsLabel: { fontSize: 16, color: '#18181B' },
  versionText: { fontSize: 16, color: '#71717A' },
  logoutWrap: { marginTop: 16, marginBottom: 32 },
});
