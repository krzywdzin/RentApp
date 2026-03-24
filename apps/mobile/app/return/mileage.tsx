import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useRental } from '@/hooks/use-rentals';
import { useReturnDraftStore } from '@/stores/return-draft.store';
import { formatMileage } from '@/lib/format';
import { WizardStepper } from '@/components/WizardStepper';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';

export default function ReturnMileageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const rentalId = useReturnDraftStore((s) => s.rentalId);
  const draftMileage = useReturnDraftStore((s) => s.returnMileage);
  const updateDraft = useReturnDraftStore((s) => s.updateDraft);
  const { data: rental } = useRental(rentalId ?? '');

  const [mileageText, setMileageText] = useState(
    draftMileage != null ? String(draftMileage) : '',
  );
  const [error, setError] = useState('');

  // Restore draft value
  useEffect(() => {
    if (draftMileage != null && mileageText === '') {
      setMileageText(String(draftMileage));
    }
  }, [draftMileage]);

  const handoverMileage = rental?.vehicle?.mileage ?? 0;
  const returnMileage = mileageText ? parseInt(mileageText, 10) : null;
  const distanceDriven =
    returnMileage != null && !isNaN(returnMileage)
      ? returnMileage - handoverMileage
      : null;

  const handleNext = () => {
    if (returnMileage == null || isNaN(returnMileage)) {
      setError('Wprowadz przebieg');
      return;
    }
    if (returnMileage < handoverMileage) {
      setError(
        `Przebieg zwrotu musi byc >= ${formatMileage(handoverMileage)}`,
      );
      return;
    }
    setError('');
    updateDraft({ returnMileage, step: 2 });
    router.push('/return/checklist');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-2">
        <WizardStepper currentStep={2} totalSteps={5} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 pb-32"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-4 text-xl font-semibold text-zinc-900">
          {t('returnWizard.step2')}
        </Text>

        {/* Handover mileage display */}
        <AppCard className="mb-4">
          <Text className="text-[13px] text-zinc-500">
            {t('returnWizard.handoverMileage')}
          </Text>
          <Text className="mt-1 text-lg font-semibold text-zinc-900">
            {formatMileage(handoverMileage)}
          </Text>
        </AppCard>

        {/* Return mileage input */}
        <AppInput
          label={t('returnWizard.returnMileage')}
          value={mileageText}
          onChangeText={(text) => {
            setMileageText(text.replace(/[^0-9]/g, ''));
            setError('');
          }}
          keyboardType="numeric"
          placeholder="0"
          error={error}
          className="mb-4"
        />

        {/* Distance driven calculation */}
        {distanceDriven != null && distanceDriven >= 0 && (
          <AppCard className="mb-4">
            <Text className="text-[13px] text-zinc-500">
              {t('returnWizard.distanceDriven')}
            </Text>
            <Text className="mt-1 text-lg font-semibold text-blue-600">
              {formatMileage(distanceDriven)}
            </Text>
          </AppCard>
        )}
      </ScrollView>

      {/* Bottom button */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-zinc-200 bg-white px-4 pb-8 pt-4">
        <AppButton title={t('common.next')} fullWidth onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}
