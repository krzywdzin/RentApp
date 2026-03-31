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
import { colors, fonts, spacing } from '@/lib/theme';

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
          <View style={s.avatarRow}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarInitial}>
                {(user?.name ?? user?.email ?? 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={s.userInfo}>
              <Text style={s.userName}>{user?.name ?? ''}</Text>
              <Text style={s.userEmail}>{user?.email ?? ''}</Text>
              <View style={s.mt8}>
                <StatusBadge status={user?.role ?? 'EMPLOYEE'} />
              </View>
            </View>
          </View>
        </AppCard>

        {/* Biometric Toggle */}
        <AppCard cardStyle={s.mb16}>
          <View style={s.settingsRow}>
            <Text style={s.settingsLabel}>Logowanie biometryczne</Text>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: colors.sand, true: colors.forestGreen }}
              thumbColor={colors.cream}
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
  safeArea: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1, paddingHorizontal: spacing.base, paddingTop: spacing.base },
  pageTitle: { marginBottom: spacing.base, fontFamily: fonts.display, fontWeight: '600', fontSize: 20, color: colors.charcoal },
  mb16: { marginBottom: spacing.base },
  mt8: { marginTop: spacing.sm },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.forestGreen, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarInitial: { fontFamily: fonts.display, fontSize: 22, color: colors.cream },
  userInfo: { flex: 1 },
  userName: { fontFamily: fonts.body, fontSize: 18, fontWeight: '500', color: colors.charcoal },
  userEmail: { marginTop: 4, fontFamily: fonts.body, fontSize: 14, color: colors.warmGray },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingsLabel: { fontFamily: fonts.body, fontSize: 16, color: colors.charcoal },
  versionText: { fontFamily: fonts.data, fontSize: 12, color: colors.warmGray },
  logoutWrap: { marginTop: spacing.base, marginBottom: 32 },
});
