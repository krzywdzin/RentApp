import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useRental, useReturnRental } from '@/hooks/use-rentals';
import { useReturnDraftStore } from '@/stores/return-draft.store';
import { formatMileage } from '@/lib/format';
import { CHECKLIST_ITEMS } from '@/lib/constants';
import { WizardStepper } from '@/components/WizardStepper';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';

export default function ReturnConfirmScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const returnMutation = useReturnRental();

  const rentalId = useReturnDraftStore((s) => s.rentalId);
  const returnMileage = useReturnDraftStore((s) => s.returnMileage);
  const checklist = useReturnDraftStore((s) => s.checklist);
  const notes = useReturnDraftStore((s) => s.notes);
  const clearDraft = useReturnDraftStore((s) => s.clearDraft);

  const { data: rental } = useRental(rentalId ?? '');

  const handoverMileage = rental?.vehicle?.mileage ?? 0;
  const distanceDriven =
    returnMileage != null ? returnMileage - handoverMileage : 0;

  const damagedItems = CHECKLIST_ITEMS.filter(
    (item) => checklist[item.key]?.damaged,
  );
  const okItems = CHECKLIST_ITEMS.filter(
    (item) => !checklist[item.key]?.damaged,
  );

  const handleSubmit = () => {
    if (!rentalId || returnMileage == null) return;

    // Build returnData for API (inspection format)
    // Build checklist summary as general notes for inspection data
    const checklistSummary = damagedItems
      .map(
        (item) =>
          `${item.label}: ${checklist[item.key]?.notes || 'uszkodzenie'}`,
      )
      .join('; ');

    const generalNotes = [checklistSummary, notes]
      .filter(Boolean)
      .join('\n\n');

    returnMutation.mutate(
      {
        id: rentalId,
        data: {
          returnMileage,
          returnData: {
            mileage: returnMileage,
            generalNotes: generalNotes || undefined,
          },
          notes: notes || undefined,
        },
      },
      {
        onSuccess: () => {
          clearDraft();
          Toast.show({
            type: 'success',
            text1: t('toasts.returnSubmitted'),
          });
          // Navigate back to rental list
          router.dismissAll();
        },
        onError: () => {
          Toast.show({
            type: 'error',
            text1: t('errors.returnFailed'),
          });
        },
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-2">
        <WizardStepper currentStep={5} totalSteps={5} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 pb-32"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-4 text-xl font-semibold text-zinc-900">
          {t('returnWizard.step5')}
        </Text>

        {/* Rental info */}
        {rental && (
          <AppCard className="mb-3">
            <Text className="mb-2 text-[13px] font-medium text-zinc-500">
              Wynajem
            </Text>
            <Text className="text-base font-semibold text-zinc-900">
              {rental.customer.firstName} {rental.customer.lastName}
            </Text>
            <Text className="mt-1 text-[13px] text-zinc-500">
              {rental.vehicle.registration} - {rental.vehicle.make}{' '}
              {rental.vehicle.model}
            </Text>
          </AppCard>
        )}

        {/* Mileage summary */}
        <AppCard className="mb-3">
          <Text className="mb-2 text-[13px] font-medium text-zinc-500">
            {t('returnWizard.step2')}
          </Text>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-[13px] text-zinc-500">
                {t('returnWizard.handoverMileage')}
              </Text>
              <Text className="text-base text-zinc-900">
                {formatMileage(handoverMileage)}
              </Text>
            </View>
            <View>
              <Text className="text-[13px] text-zinc-500">
                {t('returnWizard.returnMileage')}
              </Text>
              <Text className="text-base text-zinc-900">
                {returnMileage != null ? formatMileage(returnMileage) : '-'}
              </Text>
            </View>
          </View>
          <View className="mt-2 border-t border-zinc-100 pt-2">
            <Text className="text-[13px] text-zinc-500">
              {t('returnWizard.distanceDriven')}
            </Text>
            <Text className="text-base font-semibold text-blue-600">
              {formatMileage(distanceDriven)}
            </Text>
          </View>
        </AppCard>

        {/* Checklist summary */}
        <AppCard className="mb-3">
          <Text className="mb-2 text-[13px] font-medium text-zinc-500">
            {t('returnWizard.step3')}
          </Text>

          {/* Items with damage */}
          {damagedItems.map((item) => (
            <View key={item.key} className="mb-2 flex-row items-start">
              <View className="mr-2 mt-1 h-3 w-3 rounded-full bg-red-500" />
              <View className="flex-1">
                <Text className="text-base text-zinc-900">{item.label}</Text>
                {checklist[item.key]?.notes ? (
                  <Text className="mt-0.5 text-[13px] text-zinc-500">
                    {checklist[item.key].notes}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}

          {/* Items without damage */}
          {okItems.map((item) => (
            <View key={item.key} className="mb-1 flex-row items-center">
              <View className="mr-2 h-3 w-3 rounded-full bg-green-500" />
              <Text className="text-base text-zinc-900">{item.label}</Text>
            </View>
          ))}
        </AppCard>

        {/* Notes */}
        <AppCard className="mb-3">
          <Text className="mb-2 text-[13px] font-medium text-zinc-500">
            {t('returnWizard.step4')}
          </Text>
          <Text className="text-base text-zinc-900">
            {notes || 'Brak uwag'}
          </Text>
        </AppCard>
      </ScrollView>

      {/* Submit button */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-zinc-200 bg-white px-4 pb-8 pt-4">
        <AppButton
          title={t('returnWizard.submit')}
          fullWidth
          loading={returnMutation.isPending}
          onPress={handleSubmit}
        />
      </View>
    </SafeAreaView>
  );
}
