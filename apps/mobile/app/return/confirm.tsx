import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useRental, useReturnRental } from '@/hooks/use-rentals';
import { useReturnDraftStore } from '@/stores/return-draft.store';
import { formatMileage } from '@/lib/format';
import { CHECKLIST_ITEMS } from '@/lib/constants';
import { WizardStepper } from '@/components/WizardStepper';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
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

  const { data: rental, isLoading } = useRental(rentalId ?? '');

  useEffect(() => {
    if (!rentalId) {
      router.replace('/(tabs)/rentals');
    }
  }, [rentalId, router]);

  if (!rentalId) return null;

  if (isLoading) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.padWrap}>
          <WizardStepper currentStep={5} totalSteps={5} />
          <View style={{ marginTop: 16 }}>
            <LoadingSkeleton variant="card" count={4} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
    <SafeAreaView style={s.safeArea}>
      <View style={s.padWrap}>
        <WizardStepper currentStep={5} totalSteps={5} />
      </View>

      <ScrollView
        style={s.flex1}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.stepTitle}>{t('returnWizard.step5')}</Text>

        {/* Rental info */}
        {rental && (
          <AppCard cardStyle={s.mb12}>
            <Text style={s.sectionLabel}>Wynajem</Text>
            <Text style={s.mainText}>
              {rental.customer.firstName} {rental.customer.lastName}
            </Text>
            <Text style={s.subText}>
              {rental.vehicle.registration} - {rental.vehicle.make}{' '}
              {rental.vehicle.model}
            </Text>
          </AppCard>
        )}

        {/* Mileage summary */}
        <AppCard cardStyle={s.mb12}>
          <Text style={s.sectionLabel}>{t('returnWizard.step2')}</Text>
          <View style={s.mileageRow}>
            <View>
              <Text style={s.smallLabel}>{t('returnWizard.handoverMileage')}</Text>
              <Text style={s.valueText}>{formatMileage(handoverMileage)}</Text>
            </View>
            <View>
              <Text style={s.smallLabel}>{t('returnWizard.returnMileage')}</Text>
              <Text style={s.valueText}>
                {returnMileage != null ? formatMileage(returnMileage) : '-'}
              </Text>
            </View>
          </View>
          <View style={s.distanceWrap}>
            <Text style={s.smallLabel}>{t('returnWizard.distanceDriven')}</Text>
            <Text style={s.distanceValue}>{formatMileage(distanceDriven)}</Text>
          </View>
        </AppCard>

        {/* Checklist summary */}
        <AppCard cardStyle={s.mb12}>
          <Text style={s.sectionLabel}>{t('returnWizard.step3')}</Text>

          {/* Items with damage */}
          {damagedItems.map((item) => (
            <View key={item.key} style={s.damageRow}>
              <View style={s.redDot} />
              <View style={s.flex1}>
                <Text style={s.checkItemLabel}>{item.label}</Text>
                {checklist[item.key]?.notes ? (
                  <Text style={s.checkItemNotes}>{checklist[item.key].notes}</Text>
                ) : null}
              </View>
            </View>
          ))}

          {/* Items without damage */}
          {okItems.map((item) => (
            <View key={item.key} style={s.okRow}>
              <View style={s.greenDot} />
              <Text style={s.checkItemLabel}>{item.label}</Text>
            </View>
          ))}
        </AppCard>

        {/* Notes */}
        <AppCard cardStyle={s.mb12}>
          <Text style={s.sectionLabel}>{t('returnWizard.step4')}</Text>
          <Text style={s.valueText}>{notes || 'Brak uwag'}</Text>
        </AppCard>
      </ScrollView>

      {/* Submit button */}
      <View style={s.bottomBar}>
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

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  flex1: { flex: 1 },
  padWrap: { paddingHorizontal: 16, paddingTop: 8 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 128 },
  stepTitle: { marginBottom: 16, fontSize: 20, fontWeight: '600', color: '#18181B' },
  mb12: { marginBottom: 12 },
  sectionLabel: { marginBottom: 8, fontSize: 13, fontWeight: '500', color: '#71717A' },
  mainText: { fontSize: 16, fontWeight: '600', color: '#18181B' },
  subText: { marginTop: 4, fontSize: 13, color: '#71717A' },
  smallLabel: { fontSize: 13, color: '#71717A' },
  valueText: { fontSize: 16, color: '#18181B' },
  mileageRow: { flexDirection: 'row', justifyContent: 'space-between' },
  distanceWrap: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#F4F4F5', paddingTop: 8 },
  distanceValue: { fontSize: 16, fontWeight: '600', color: '#3B82F6' },
  damageRow: { marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start' },
  redDot: { marginRight: 8, marginTop: 6, height: 12, width: 12, borderRadius: 6, backgroundColor: '#EF4444' },
  greenDot: { marginRight: 8, height: 12, width: 12, borderRadius: 6, backgroundColor: '#22C55E' },
  okRow: { marginBottom: 4, flexDirection: 'row', alignItems: 'center' },
  checkItemLabel: { fontSize: 16, color: '#18181B' },
  checkItemNotes: { marginTop: 2, fontSize: 13, color: '#71717A' },
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
