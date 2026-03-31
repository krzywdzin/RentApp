import React, { useCallback } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { AppButton } from '@/components/AppButton';
import { useRentalDraftStore } from '@/stores/rental-draft.store';
import { contractsApi } from '@/api/contracts.api';
import { colors, fonts, spacing } from '@/lib/theme';

export default function SuccessScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { contractId } = useLocalSearchParams<{ contractId?: string }>();
  const draft = useRentalDraftStore();

  const handleViewPdf = useCallback(async () => {
    if (!contractId) return;
    try {
      const url = await contractsApi.getPdfUrl(contractId);
      await Linking.openURL(url);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Nie udalo sie otworzyc PDF',
        text2: 'Sprawdz czy masz zainstalowana przegladarke',
      });
    }
  }, [contractId]);

  const handleNewRental = useCallback(() => {
    draft.clearDraft();
    router.replace('/(tabs)/new-rental');
  }, [draft, router]);

  const handleBackToHome = useCallback(() => {
    draft.clearDraft();
    router.replace('/(tabs)');
  }, [draft, router]);

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <View style={s.center}>
        {/* Checkmark icon */}
        <View style={s.checkCircle}>
          <Check size={32} color="#FFFFFF" strokeWidth={3} />
        </View>

        {/* Heading */}
        <Text style={s.heading}>{t('wizard.successHeading')}</Text>

        {/* Body */}
        <Text style={s.body}>{t('wizard.successBody')}</Text>

        {/* View PDF link */}
        {contractId && (
          <Text style={s.pdfLink} onPress={handleViewPdf}>
            {t('wizard.viewPdf')}
          </Text>
        )}
      </View>

      {/* Bottom buttons */}
      <View style={s.bottomWrap}>
        <AppButton
          title={t('wizard.newRentalBtn')}
          onPress={handleNewRental}
          fullWidth
          containerStyle={s.mb12}
        />
        <AppButton
          title={t('wizard.backToHome')}
          variant="secondary"
          onPress={handleBackToHome}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
  checkCircle: {
    height: 64,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: colors.forestGreen,
  },
  heading: { marginTop: 24, fontFamily: fonts.display, fontWeight: '600', fontSize: 22, color: colors.charcoal, textAlign: 'center' },
  body: { marginTop: 8, fontFamily: fonts.body, textAlign: 'center', fontSize: 16, color: colors.warmGray },
  pdfLink: { marginTop: 16, fontFamily: fonts.body, fontSize: 16, fontWeight: '600', color: colors.forestGreen },
  bottomWrap: { paddingHorizontal: spacing.base, paddingBottom: spacing.base },
  mb12: { marginBottom: spacing.md },
});
