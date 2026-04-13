import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRental } from '@/hooks/use-rentals';
import { formatDate, formatDateTime, formatCurrency, formatMileage } from '@/lib/format';
import { AlertTriangle } from 'lucide-react-native';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { colors, fonts, spacing } from '@/lib/theme';

export default function RentalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: rental, isLoading, isError, refetch } = useRental(id ?? '');

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <View style={s.loadingWrap}>
          <LoadingSkeleton variant="card" count={4} />
        </View>
      </>
    );
  }

  if (isError || !rental) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <View style={s.errorCenter}>
          <AlertTriangle size={48} color="#DC2626" />
          <Text style={s.errorTitle}>Nie udalo sie zaladowac danych</Text>
          <Text style={s.errorSub}>Sprawdz polaczenie i sprobuj ponownie</Text>
          <AppButton
            title="Sprobuj ponownie"
            onPress={() => refetch()}
            containerStyle={s.mt16}
          />
        </View>
      </>
    );
  }

  const startDate = new Date(rental.startDate);
  const endDate = new Date(rental.endDate);
  const durationDays = Math.max(
    1,
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  const isActiveOrExtended =
    rental.status === 'ACTIVE' || rental.status === 'EXTENDED';
  const isReturned = rental.status === 'RETURNED';

  return (
    <>
      <Stack.Screen
        options={{
          title: `${rental.vehicle.registration}`,
          headerBackTitle: t('common.back'),
        }}
      />
      <View style={s.root}>
        <ScrollView
          style={s.flex1}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Status */}
          <View style={s.statusRow}>
            <Text style={s.regTitle}>{rental.vehicle.registration}</Text>
            <StatusBadge status={rental.status} />
          </View>

          {/* Customer */}
          <AppCard cardStyle={[s.mb12, s.cardSage]}>
            <Text style={s.sectionLabel}>Klient</Text>
            <Text style={s.mainText}>
              {rental.customer.firstName} {rental.customer.lastName}
            </Text>
            {rental.customer.phone && (
              <Text style={s.subText}>{rental.customer.phone}</Text>
            )}
            {rental.customer.email && (
              <Text style={s.subText}>{rental.customer.email}</Text>
            )}
          </AppCard>

          {/* Vehicle */}
          <AppCard cardStyle={[s.mb12, s.cardSage]}>
            <Text style={s.sectionLabel}>Pojazd</Text>
            <Text style={s.mainText}>{rental.vehicle.registration}</Text>
            <Text style={s.subText}>
              {rental.vehicle.make} {rental.vehicle.model} ({rental.vehicle.year})
            </Text>
            {rental.vehicle.vehicleClass?.name && (
              <Text style={s.subText}>Klasa: {rental.vehicle.vehicleClass.name}</Text>
            )}
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
                <Text style={s.dateText}>{formatDateTime(rental.startDate)}</Text>
              </View>
              <View>
                <Text style={s.smallLabel}>Do</Text>
                <Text style={s.dateText}>{formatDateTime(rental.endDate)}</Text>
              </View>
            </View>
            <Text style={s.durationText}>
              Czas trwania: {durationDays}{' '}
              {durationDays === 1 ? 'dzien' : 'dni'}
            </Text>
          </AppCard>

          {/* Locations */}
          {((rental as any).pickupLocation || (rental as any).returnLocation) && (
            <AppCard cardStyle={s.mb12}>
              <Text style={s.sectionLabel}>Lokalizacje</Text>
              {(rental as any).pickupLocation && (
                <>
                  <Text style={s.smallLabel}>Miejsce wydania</Text>
                  <Text style={s.mainText}>{(rental as any).pickupLocation.address}</Text>
                </>
              )}
              {(rental as any).returnLocation && (
                <>
                  <Text style={[(rental as any).pickupLocation ? s.mt8 : undefined, s.smallLabel]}>Miejsce zdania</Text>
                  <Text style={s.mainText}>{(rental as any).returnLocation.address}</Text>
                </>
              )}
            </AppCard>
          )}

          {/* Pricing */}
          <AppCard cardStyle={[s.mb12, s.cardStone]}>
            <Text style={s.sectionLabel}>Ceny</Text>
            <View style={s.priceRow}>
              <Text style={s.smallLabel}>Stawka dzienna netto</Text>
              <Text style={s.dateText}>{formatCurrency(rental.dailyRateNet)}</Text>
            </View>
            <View style={s.priceTotalRow}>
              <Text style={s.mainText}>Razem brutto</Text>
              <Text style={s.grossTotal}>{formatCurrency(rental.totalPriceGross)}</Text>
            </View>
          </AppCard>

          {/* Company data */}
          {rental.isCompanyRental && (
            <AppCard cardStyle={s.mb12}>
              <Text style={s.sectionLabel}>Dane firmy</Text>
              <View style={s.priceRow}>
                <Text style={s.smallLabel}>NIP</Text>
                <Text style={s.dateText}>{rental.companyNip || '-'}</Text>
              </View>
              <View style={[s.priceRow, { marginTop: 8 }]}>
                <Text style={s.smallLabel}>Platnik VAT</Text>
                <Text style={s.dateText}>
                  {rental.vatPayerStatus === 'FULL_100' ? '100%' : rental.vatPayerStatus === 'HALF_50' ? '50%' : rental.vatPayerStatus === 'NONE' ? 'Nie' : '-'}
                </Text>
              </View>
            </AppCard>
          )}

          {/* Insurance */}
          {rental.insuranceCaseNumber ? (
            <AppCard cardStyle={s.mb12}>
              <Text style={s.sectionLabel}>Ubezpieczenie</Text>
              <Text style={s.dateText}>Nr sprawy: {rental.insuranceCaseNumber}</Text>
            </AppCard>
          ) : null}

          {/* Return data (if returned) */}
          {isReturned && rental.returnData && (
            <AppCard cardStyle={s.mb12}>
              <Text style={s.sectionLabel}>Dane zwrotu</Text>
              {rental.returnMileage != null && (
                <Text style={s.dateText}>
                  Przebieg zwrotu: {formatMileage(rental.returnMileage)}
                </Text>
              )}
              {rental.returnData.generalNotes && (
                <Text style={[s.subText, { marginTop: 8 }]}>
                  {rental.returnData.generalNotes}
                </Text>
              )}
            </AppCard>
          )}

          {/* Notes */}
          {rental.notes && (
            <AppCard cardStyle={s.mb12}>
              <Text style={s.sectionLabel}>Uwagi</Text>
              <Text style={s.dateText}>{rental.notes}</Text>
            </AppCard>
          )}
        </ScrollView>

        {/* Action Buttons */}
        {isActiveOrExtended && (
          <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <AppButton
              title={t('rentals.startReturn')}
              fullWidth
              onPress={() => router.push(`/return/${rental.id}`)}
            />
          </View>
        )}
      </View>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  flex1: { flex: 1 },
  loadingWrap: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: spacing.base, paddingTop: spacing.base },
  scrollContent: { paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: 128 },
  statusRow: { marginBottom: spacing.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  regTitle: { fontFamily: fonts.display, fontSize: 20, fontWeight: '600', color: colors.charcoal },
  mb12: { marginBottom: spacing.md },
  sectionLabel: { marginBottom: 8, fontFamily: fonts.body, fontSize: 13, fontWeight: '500', color: colors.warmGray },
  mainText: { fontFamily: fonts.body, fontSize: 16, fontWeight: '600', color: colors.charcoal },
  subText: { marginTop: 4, fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  smallLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  dateText: { fontFamily: fonts.data, fontSize: 16, color: colors.charcoal },
  datesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  durationText: { marginTop: 8, fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceTotalRow: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  errorCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, backgroundColor: colors.cream },
  errorTitle: { marginTop: 16, fontFamily: fonts.body, fontSize: 18, fontWeight: '600', color: colors.charcoal, textAlign: 'center' },
  errorSub: { marginTop: 8, fontFamily: fonts.body, fontSize: 14, color: colors.warmGray, textAlign: 'center' },
  cardSage: { backgroundColor: colors.sageWash },
  cardStone: { backgroundColor: colors.warmStone },
  grossTotal: { fontFamily: fonts.display, color: colors.forestGreen, fontWeight: '500', fontSize: 16 },
  mt8: { marginTop: 8 },
  mt16: { marginTop: spacing.base },
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
