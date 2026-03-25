import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
    <SafeAreaView style={s.safeArea}>
      <View style={s.padWrap}>
        <WizardStepper currentStep={2} totalSteps={5} />
      </View>

      <ScrollView
        style={s.flex1}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.stepTitle}>{t('returnWizard.step2')}</Text>

        {/* Handover mileage display */}
        <AppCard cardStyle={s.mb16}>
          <Text style={s.cardLabel}>{t('returnWizard.handoverMileage')}</Text>
          <Text style={s.cardValue}>{formatMileage(handoverMileage)}</Text>
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
          containerStyle={s.mb16}
        />

        {/* Distance driven calculation */}
        {distanceDriven != null && distanceDriven >= 0 && (
          <AppCard cardStyle={s.mb16}>
            <Text style={s.cardLabel}>{t('returnWizard.distanceDriven')}</Text>
            <Text style={s.distanceValue}>{formatMileage(distanceDriven)}</Text>
          </AppCard>
        )}
      </ScrollView>

      {/* Bottom button */}
      <View style={s.bottomBar}>
        <AppButton title={t('common.next')} fullWidth onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  flex1: { flex: 1 },
  padWrap: { paddingHorizontal: 16, paddingTop: 8 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 128 },
  stepTitle: { marginBottom: 16, fontSize: 20, fontWeight: '600', color: '#18181B' },
  mb16: { marginBottom: 16 },
  cardLabel: { fontSize: 13, color: '#71717A' },
  cardValue: { marginTop: 4, fontSize: 18, fontWeight: '600', color: '#18181B' },
  distanceValue: { marginTop: 4, fontSize: 18, fontWeight: '600', color: '#3B82F6' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 16,
  },
});
