import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { DAMAGE_TYPE_LABELS, CLEANLINESS_LABELS } from '@rentapp/shared';

import { useRental, useReturnRental, useCreateReturnProtocol } from '@/hooks/use-rentals';
import { useReturnDraftStore, useReturnDraftHasHydrated, RETURN_WIZARD_TOTAL_STEPS } from '@/stores/return-draft.store';
import { formatMileage } from '@/lib/format';
import { WizardStepper } from '@/components/WizardStepper';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { colors, fonts, spacing } from '@/lib/theme';

export default function ReturnConfirmScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hasHydrated = useReturnDraftHasHydrated();
  const returnMutation = useReturnRental();
  const protocolMutation = useCreateReturnProtocol();

  const rentalId = useReturnDraftStore((s) => s.rentalId);
  const returnMileage = useReturnDraftStore((s) => s.returnMileage);
  const damagePins = useReturnDraftStore((s) => s.damagePins);
  const notes = useReturnDraftStore((s) => s.notes);
  const protocolCleanliness = useReturnDraftStore((s) => s.protocolCleanliness);
  const protocolCleanlinessNote = useReturnDraftStore((s) => s.protocolCleanlinessNote);
  const protocolOtherNotes = useReturnDraftStore((s) => s.protocolOtherNotes);
  const protocolCustomerSignature = useReturnDraftStore((s) => s.protocolCustomerSignature);
  const protocolWorkerSignature = useReturnDraftStore((s) => s.protocolWorkerSignature);
  const clearDraft = useReturnDraftStore((s) => s.clearDraft);

  const { data: rental, isLoading } = useRental(rentalId ?? '');

  useEffect(() => {
    if (hasHydrated && !rentalId) {
      router.replace('/(tabs)/rentals');
    }
  }, [hasHydrated, rentalId, router]);

  if (!hasHydrated || !rentalId) return null;

  if (isLoading) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.padWrap}>
          <WizardStepper currentStep={8} totalSteps={RETURN_WIZARD_TOTAL_STEPS} />
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

  const handleSubmit = async () => {
    if (!rentalId || returnMileage == null) return;
    if (!protocolCleanliness || !protocolCustomerSignature || !protocolWorkerSignature) return;

    // Step 1: Create return protocol
    try {
      await protocolMutation.mutateAsync({
        rentalId,
        cleanliness: protocolCleanliness,
        cleanlinessNote: protocolCleanlinessNote || undefined,
        otherNotes: protocolOtherNotes || undefined,
        customerSignatureBase64: protocolCustomerSignature,
        workerSignatureBase64: protocolWorkerSignature,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Nie udalo sie utworzyc protokolu zwrotu. Sprobuj ponownie.',
      });
      return;
    }

    // Step 2: Return the rental (existing logic)
    const damageSummary = damagePins
      .map(
        (p) =>
          `#${p.pinNumber} ${DAMAGE_TYPE_LABELS[p.damageType]}${p.note ? ': ' + p.note : ''}`,
      )
      .join('; ');

    const generalNotes = [damageSummary, notes]
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
          router.replace('/(tabs)/rentals');
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
        <WizardStepper currentStep={8} totalSteps={RETURN_WIZARD_TOTAL_STEPS} />
      </View>

      <ScrollView
        style={s.flex1}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.stepTitle}>{t('returnWizard.step5')}</Text>

        {/* Rental info */}
        {rental && (
          <AppCard cardStyle={[s.mb12, s.cardStone]}>
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
        <AppCard cardStyle={[s.mb12, s.cardStone]}>
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

        {/* Damage pins summary */}
        <AppCard cardStyle={[s.mb12, s.cardStone]}>
          <Text style={s.sectionLabel}>{t('returnWizard.step3')}</Text>

          {damagePins.length > 0 ? (
            damagePins.map((pin) => (
              <View key={pin.pinNumber} style={s.damageRow}>
                <View style={s.redDot} />
                <View style={s.flex1}>
                  <Text style={s.checkItemLabel}>
                    #{pin.pinNumber} {DAMAGE_TYPE_LABELS[pin.damageType]}
                  </Text>
                  {pin.note ? (
                    <Text style={s.checkItemNotes}>{pin.note}</Text>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <View style={s.okRow}>
              <View style={s.greenDot} />
              <Text style={s.checkItemLabel}>Brak uszkodzen</Text>
            </View>
          )}
        </AppCard>

        {/* Notes */}
        <AppCard cardStyle={[s.mb12, s.cardStone]}>
          <Text style={s.sectionLabel}>{t('returnWizard.step4')}</Text>
          <Text style={s.valueText}>{notes || 'Brak uwag'}</Text>
        </AppCard>

        {/* Protocol summary */}
        <AppCard cardStyle={[s.mb12, s.cardStone]}>
          <Text style={s.sectionLabel}>Protokol zwrotu</Text>
          <Text style={s.valueText}>
            Czystosc: {protocolCleanliness ? CLEANLINESS_LABELS[protocolCleanliness] : '-'}
          </Text>
          {protocolCleanlinessNote ? (
            <Text style={s.subText}>{protocolCleanlinessNote}</Text>
          ) : null}
          {protocolOtherNotes ? (
            <>
              <Text style={[s.smallLabel, { marginTop: 8 }]}>Inne</Text>
              <Text style={s.valueText}>{protocolOtherNotes}</Text>
            </>
          ) : null}
          <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={s.valueText}>
              Podpis klienta: {protocolCustomerSignature ? 'Podpisano' : 'Brak'}
            </Text>
            <Text style={s.valueText}>
              Podpis pracownika: {protocolWorkerSignature ? 'Podpisano' : 'Brak'}
            </Text>
          </View>
        </AppCard>
      </ScrollView>

      {/* Submit button */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <AppButton
          title={t('returnWizard.submit')}
          fullWidth
          loading={protocolMutation.isPending || returnMutation.isPending}
          onPress={handleSubmit}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  flex1: { flex: 1 },
  padWrap: { paddingHorizontal: spacing.base, paddingTop: 8 },
  scrollContent: { paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: 128 },
  stepTitle: { marginBottom: spacing.base, fontFamily: fonts.display, fontSize: 20, fontWeight: '600', color: colors.charcoal },
  mb12: { marginBottom: spacing.md },
  sectionLabel: { marginBottom: 8, fontFamily: fonts.body, fontSize: 13, fontWeight: '500', color: colors.warmGray },
  mainText: { fontFamily: fonts.body, fontSize: 16, fontWeight: '600', color: colors.charcoal },
  subText: { marginTop: 4, fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  smallLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  valueText: { fontFamily: fonts.data, fontSize: 16, color: colors.charcoal },
  mileageRow: { flexDirection: 'row', justifyContent: 'space-between' },
  distanceWrap: { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.sand, paddingTop: 8 },
  distanceValue: { fontFamily: fonts.data, fontSize: 16, color: colors.charcoal },
  damageRow: { marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start' },
  redDot: { marginRight: 8, marginTop: 6, height: 12, width: 12, borderRadius: 6, backgroundColor: colors.terracotta },
  greenDot: { marginRight: 8, height: 12, width: 12, borderRadius: 6, backgroundColor: colors.forestGreen },
  okRow: { marginBottom: 4, flexDirection: 'row', alignItems: 'center' },
  checkItemLabel: { fontFamily: fonts.body, fontSize: 16, color: colors.charcoal },
  checkItemNotes: { marginTop: 2, fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  cardStone: { backgroundColor: colors.warmStone },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: colors.sand,
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
  },
});
