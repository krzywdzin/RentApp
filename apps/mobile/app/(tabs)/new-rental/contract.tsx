import React, { useCallback } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Check, Square } from 'lucide-react-native';

import { WizardStepper } from '@/components/WizardStepper';
import { AppButton } from '@/components/AppButton';
import { useRentalDraftStore } from '@/stores/rental-draft.store';
import { formatDateTime, formatCurrency } from '@/lib/format';
import { RENTAL_WIZARD_LABELS, VAT_MULTIPLIER, ONE_DAY_MS } from '@/lib/constants';
import { colors, fonts, spacing } from '@/lib/theme';

export default function ContractStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useRentalDraftStore();
  const insets = useSafeAreaInsets();

  const days = (() => {
    if (!draft.startDate || !draft.endDate) return 0;
    const diffMs =
      new Date(draft.endDate).getTime() - new Date(draft.startDate).getTime();
    return Math.max(Math.ceil(diffMs / ONE_DAY_MS), 0);
  })();

  const totalNetGrosze = (draft.dailyRateNet ?? 0) * days;
  const totalGrossGrosze = Math.round(totalNetGrosze * VAT_MULTIPLIER);

  const handleToggleRodo = useCallback(() => {
    if (draft.rodoConsent) {
      draft.updateDraft({
        rodoConsent: false,
        rodoTimestamp: null,
      });
    } else {
      draft.updateDraft({
        rodoConsent: true,
        rodoTimestamp: new Date().toISOString(),
      });
    }
  }, [draft]);

  const handleNext = useCallback(() => {
    draft.updateDraft({ step: 4 });
    router.push('/(tabs)/new-rental/photos');
  }, [draft, router]);

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <WizardStepper
        currentStep={4}
        totalSteps={6}
        labels={RENTAL_WIZARD_LABELS}
      />

      <Text style={s.stepTitle}>
        {t('wizard.step4')}
      </Text>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex1}>
        <ScrollView
          style={s.scrollBody}
          contentContainerStyle={{ paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Contract Preview */}
          <View style={s.previewBox}>
            {/* Customer section */}
            <Text style={s.sectionHeader}>Klient</Text>
            <Text style={s.sectionValue}>{draft.customerName ?? '-'}</Text>

            {/* Vehicle section */}
            <Text style={[s.sectionHeader, s.mt16]}>Pojazd</Text>
            <Text style={s.sectionValue}>{draft.vehicleLabel ?? '-'}</Text>

            {/* Dates section */}
            <Text style={[s.sectionHeader, s.mt16]}>Okres wynajmu</Text>
            <View style={s.datesRow}>
              <Text style={s.sectionValue}>
                {draft.startDate ? formatDateTime(draft.startDate) : '-'}
              </Text>
              <Text style={s.dash}>-</Text>
              <Text style={s.sectionValue}>
                {draft.endDate ? formatDateTime(draft.endDate) : '-'}
              </Text>
            </View>
            <Text style={s.daysText}>
              {days} {days === 1 ? 'dzien' : 'dni'}
            </Text>

            {/* Pricing section */}
            <Text style={[s.sectionHeader, s.mt16]}>Cennik</Text>
            <View style={s.mt4}>
              <View style={s.priceRow}>
                <Text style={s.priceLabel}>{t('wizard.dailyRate')}</Text>
                <Text style={s.priceValue}>{formatCurrency(draft.dailyRateNet ?? 0)}</Text>
              </View>
              <View style={s.priceRowMt}>
                <Text style={s.priceLabel}>Razem netto</Text>
                <Text style={s.priceValue}>{formatCurrency(totalNetGrosze)}</Text>
              </View>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>{t('wizard.totalGross')}</Text>
                <Text style={s.totalValue}>{formatCurrency(totalGrossGrosze)}</Text>
              </View>
            </View>
          </View>

          {/* RODO Consent */}
          <Pressable
            style={s.rodoRow}
            onPress={handleToggleRodo}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: draft.rodoConsent }}
          >
            {draft.rodoConsent ? (
              <View style={s.checkboxChecked}>
                <Check size={16} color={colors.cream} />
              </View>
            ) : (
              <View style={s.checkboxUnchecked}>
                <Square size={24} color={colors.sand} />
              </View>
            )}
            <Text style={s.rodoText}>{t('wizard.rodoConsent')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom CTA */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <AppButton
          title={t('wizard.signCta')}
          onPress={handleNext}
          disabled={!draft.rodoConsent}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  flex1: { flex: 1 },
  stepTitle: { marginTop: spacing.base, paddingHorizontal: spacing.base, fontFamily: fonts.display, fontSize: 20, fontWeight: '600', color: colors.charcoal },
  scrollBody: { flex: 1, paddingHorizontal: spacing.base, paddingTop: spacing.base },
  previewBox: {
    borderRadius: 8,
    backgroundColor: colors.warmStone,
    padding: spacing.base,
  },
  sectionHeader: { fontFamily: fonts.body, fontSize: 13, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1, color: colors.warmGray },
  sectionValue: { marginTop: 4, fontFamily: fonts.data, fontSize: 16, color: colors.charcoal },
  mt16: { marginTop: spacing.base },
  mt4: { marginTop: 4 },
  datesRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dash: { color: colors.warmGray },
  daysText: { marginTop: 4, fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceRowMt: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  priceValue: { fontFamily: fonts.data, fontSize: 16, color: colors.charcoal },
  totalRow: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.sand,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: { fontFamily: fonts.body, fontSize: 16, fontWeight: '500', color: colors.charcoal },
  totalValue: { fontFamily: fonts.display, fontWeight: '500', fontSize: 18, color: colors.forestGreen },
  rodoRow: { marginTop: 24, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkboxChecked: {
    marginTop: 2,
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: colors.forestGreen,
  },
  checkboxUnchecked: { marginTop: 2 },
  rodoText: { flex: 1, fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.charcoal },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: colors.sand,
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.base,
    paddingTop: 12,
  },
});
