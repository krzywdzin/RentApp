import React, { useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Check, Square } from 'lucide-react-native';

import { WizardStepper } from '@/components/WizardStepper';
import { AppButton } from '@/components/AppButton';
import { useRentalDraftStore } from '@/stores/rental-draft.store';
import { formatDateTime, formatCurrency } from '@/lib/format';

const WIZARD_LABELS = ['Klient', 'Pojazd', 'Daty', 'Umowa', 'Podpisy'];

export default function ContractStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useRentalDraftStore();

  const days = (() => {
    if (!draft.startDate || !draft.endDate) return 0;
    const diffMs =
      new Date(draft.endDate).getTime() - new Date(draft.startDate).getTime();
    return Math.max(Math.ceil(diffMs / 86400000), 0);
  })();

  const totalNetGrosze = (draft.dailyRateNet ?? 0) * days;
  const totalGrossGrosze = Math.round(totalNetGrosze * 1.23);

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
    router.push('/(tabs)/new-rental/signatures');
  }, [draft, router]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <WizardStepper
        currentStep={4}
        totalSteps={5}
        labels={WIZARD_LABELS}
      />

      <Text className="mt-4 px-4 text-xl font-semibold text-zinc-900">
        {t('wizard.step4')}
      </Text>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* Contract Preview */}
        <View className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          {/* Customer section */}
          <Text className="text-[13px] font-semibold uppercase tracking-wider text-zinc-400">
            Klient
          </Text>
          <Text className="mt-1 text-base text-zinc-900">
            {draft.customerName ?? '-'}
          </Text>

          {/* Vehicle section */}
          <Text className="mt-4 text-[13px] font-semibold uppercase tracking-wider text-zinc-400">
            Pojazd
          </Text>
          <Text className="mt-1 text-base text-zinc-900">
            {draft.vehicleLabel ?? '-'}
          </Text>

          {/* Dates section */}
          <Text className="mt-4 text-[13px] font-semibold uppercase tracking-wider text-zinc-400">
            Okres wynajmu
          </Text>
          <View className="mt-1 flex-row items-center gap-2">
            <Text className="text-base text-zinc-900">
              {draft.startDate ? formatDateTime(draft.startDate) : '-'}
            </Text>
            <Text className="text-zinc-400">-</Text>
            <Text className="text-base text-zinc-900">
              {draft.endDate ? formatDateTime(draft.endDate) : '-'}
            </Text>
          </View>
          <Text className="mt-1 text-[13px] text-zinc-500">
            {days} {days === 1 ? 'dzien' : 'dni'}
          </Text>

          {/* Pricing section */}
          <Text className="mt-4 text-[13px] font-semibold uppercase tracking-wider text-zinc-400">
            Cennik
          </Text>
          <View className="mt-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-[13px] text-zinc-500">
                {t('wizard.dailyRate')}
              </Text>
              <Text className="text-base text-zinc-900">
                {formatCurrency(draft.dailyRateNet ?? 0)}
              </Text>
            </View>
            <View className="mt-1 flex-row items-center justify-between">
              <Text className="text-[13px] text-zinc-500">Razem netto</Text>
              <Text className="text-base text-zinc-900">
                {formatCurrency(totalNetGrosze)}
              </Text>
            </View>
            <View className="mt-2 border-t border-zinc-200 pt-2 flex-row items-center justify-between">
              <Text className="text-base font-semibold text-zinc-900">
                {t('wizard.totalGross')}
              </Text>
              <Text className="text-lg font-semibold text-zinc-900">
                {formatCurrency(totalGrossGrosze)}
              </Text>
            </View>
          </View>
        </View>

        {/* RODO Consent */}
        <Pressable
          className="mt-6 flex-row items-start gap-3"
          onPress={handleToggleRodo}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: draft.rodoConsent }}
        >
          {draft.rodoConsent ? (
            <View className="mt-0.5 h-6 w-6 items-center justify-center rounded bg-blue-600">
              <Check size={16} color="#FFFFFF" />
            </View>
          ) : (
            <View className="mt-0.5">
              <Square size={24} color="#D4D4D8" />
            </View>
          )}
          <Text className="flex-1 text-base leading-6 text-zinc-700">
            {t('wizard.rodoConsent')}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-zinc-100 bg-white px-4 pb-8 pt-3">
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
