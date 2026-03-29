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
                <Check size={16} color="#FFFFFF" />
              </View>
            ) : (
              <View style={s.checkboxUnchecked}>
                <Square size={24} color="#D4D4D8" />
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
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  flex1: { flex: 1 },
  stepTitle: { marginTop: 16, paddingHorizontal: 16, fontSize: 20, fontWeight: '600', color: '#18181B' },
  scrollBody: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  previewBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FAFAFA',
    padding: 16,
  },
  sectionHeader: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, color: '#A1A1AA' },
  sectionValue: { marginTop: 4, fontSize: 16, color: '#18181B' },
  mt16: { marginTop: 16 },
  mt4: { marginTop: 4 },
  datesRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dash: { color: '#A1A1AA' },
  daysText: { marginTop: 4, fontSize: 13, color: '#71717A' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceRowMt: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel: { fontSize: 13, color: '#71717A' },
  priceValue: { fontSize: 16, color: '#18181B' },
  totalRow: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#18181B' },
  totalValue: { fontSize: 18, fontWeight: '600', color: '#18181B' },
  rodoRow: { marginTop: 24, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkboxChecked: {
    marginTop: 2,
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  checkboxUnchecked: { marginTop: 2 },
  rodoText: { flex: 1, fontSize: 16, lineHeight: 24, color: '#3F3F46' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
