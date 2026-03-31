import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useRental } from '@/hooks/use-rentals';
import { useReturnDraftStore } from '@/stores/return-draft.store';
import { formatDate, formatMileage } from '@/lib/format';
import { WizardStepper } from '@/components/WizardStepper';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { colors, fonts, spacing } from '@/lib/theme';

const RENTAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Wersja robocza',
  ACTIVE: 'Aktywny',
  EXTENDED: 'Przedluzony',
  RETURNED: 'Zwrócony',
  CANCELLED: 'Anulowany',
};

export default function ReturnConfirmRentalScreen() {
  const { rentalId } = useLocalSearchParams<{ rentalId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: rental, isLoading } = useRental(rentalId ?? '');
  const updateDraft = useReturnDraftStore((s) => s.updateDraft);

  useEffect(() => {
    if (rentalId) {
      updateDraft({ rentalId, step: 1 });
    }
  }, [rentalId, updateDraft]);

  if (isLoading) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.padWrap}>
          <WizardStepper currentStep={1} totalSteps={5} />
          <LoadingSkeleton variant="card" count={3} />
        </View>
      </SafeAreaView>
    );
  }

  const isValidStatus =
    rental?.status === 'ACTIVE' || rental?.status === 'EXTENDED';

  if (!rental || !isValidStatus) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.errorCenter}>
          <Text style={s.errorText}>
            {!rental
              ? 'Nie znaleziono wynajmu'
              : `Wynajem nie moze byc zwrocony (status: ${RENTAL_STATUS_LABELS[rental.status] ?? rental.status})`}
          </Text>
          <AppButton
            title={t('common.back')}
            variant="secondary"
            containerStyle={s.mt16}
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.padWrapSmall}>
        <WizardStepper currentStep={1} totalSteps={5} />
      </View>

      <ScrollView
        style={s.flex1}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.stepTitle}>{t('returnWizard.step1')}</Text>

        {/* Customer */}
        <AppCard cardStyle={s.mb12}>
          <Text style={s.sectionLabel}>Klient</Text>
          <Text style={s.mainText}>
            {rental.customer.firstName} {rental.customer.lastName}
          </Text>
          {rental.customer.phone && (
            <Text style={s.subText}>{rental.customer.phone}</Text>
          )}
        </AppCard>

        {/* Vehicle */}
        <AppCard cardStyle={s.mb12}>
          <Text style={s.sectionLabel}>Pojazd</Text>
          <Text style={s.mainText}>{rental.vehicle.registration}</Text>
          <Text style={s.subText}>
            {rental.vehicle.make} {rental.vehicle.model} ({rental.vehicle.year})
          </Text>
          <Text style={s.subText}>
            Przebieg: {formatMileage(rental.vehicle.mileage)}
          </Text>
        </AppCard>

        {/* Dates */}
        <AppCard cardStyle={s.mb12}>
          <Text style={s.sectionLabel}>Terminy</Text>
          <View style={s.datesRow}>
            <View>
              <Text style={s.smallLabel}>Od</Text>
              <Text style={s.dateText}>{formatDate(rental.startDate)}</Text>
            </View>
            <View>
              <Text style={s.smallLabel}>Do</Text>
              <Text style={s.dateText}>{formatDate(rental.endDate)}</Text>
            </View>
          </View>
        </AppCard>

        {/* Status */}
        <AppCard cardStyle={s.mb12}>
          <View style={s.statusRow}>
            <Text style={s.sectionLabelInline}>Status</Text>
            <StatusBadge status={rental.status} />
          </View>
        </AppCard>
      </ScrollView>

      {/* Bottom button */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <AppButton
          title={t('common.next')}
          fullWidth
          onPress={() => router.push('/return/mileage')}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  flex1: { flex: 1 },
  padWrap: { paddingHorizontal: spacing.base, paddingTop: spacing.base },
  padWrapSmall: { paddingHorizontal: spacing.base, paddingTop: 8 },
  scrollContent: { paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: 128 },
  errorCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.base },
  errorText: { fontFamily: fonts.body, textAlign: 'center', fontSize: 16, color: colors.warmGray },
  mt16: { marginTop: spacing.base },
  mb12: { marginBottom: spacing.md },
  stepTitle: { marginBottom: spacing.base, fontFamily: fonts.display, fontSize: 20, fontWeight: '600', color: colors.charcoal },
  sectionLabel: { marginBottom: 8, fontFamily: fonts.body, fontSize: 13, fontWeight: '500', color: colors.warmGray },
  sectionLabelInline: { fontFamily: fonts.body, fontSize: 13, fontWeight: '500', color: colors.warmGray },
  mainText: { fontFamily: fonts.body, fontSize: 16, fontWeight: '600', color: colors.charcoal },
  subText: { marginTop: 4, fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  smallLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  dateText: { fontFamily: fonts.data, fontSize: 16, color: colors.charcoal },
  datesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
