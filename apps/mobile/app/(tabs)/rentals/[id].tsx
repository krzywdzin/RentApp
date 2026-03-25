import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useRental } from '@/hooks/use-rentals';
import { formatDate, formatDateTime, formatCurrency, formatMileage } from '@/lib/format';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

export default function RentalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: rental, isLoading } = useRental(id ?? '');

  if (isLoading || !rental) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <View style={s.loadingWrap}>
          <LoadingSkeleton variant="card" count={4} />
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
          <AppCard cardStyle={s.mb12}>
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

          {/* Pricing */}
          <AppCard cardStyle={s.mb12}>
            <Text style={s.sectionLabel}>Ceny</Text>
            <View style={s.priceRow}>
              <Text style={s.smallLabel}>Stawka dzienna netto</Text>
              <Text style={s.dateText}>{formatCurrency(rental.dailyRateNet)}</Text>
            </View>
            <View style={s.priceTotalRow}>
              <Text style={s.mainText}>Razem brutto</Text>
              <Text style={s.mainText}>{formatCurrency(rental.totalPriceGross)}</Text>
            </View>
          </AppCard>

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
          <View style={s.bottomBar}>
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
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex1: { flex: 1 },
  loadingWrap: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 16 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 128 },
  statusRow: { marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  regTitle: { fontSize: 20, fontWeight: '600', color: '#18181B' },
  mb12: { marginBottom: 12 },
  sectionLabel: { marginBottom: 8, fontSize: 13, fontWeight: '500', color: '#71717A' },
  mainText: { fontSize: 16, fontWeight: '600', color: '#18181B' },
  subText: { marginTop: 4, fontSize: 13, color: '#71717A' },
  smallLabel: { fontSize: 13, color: '#71717A' },
  dateText: { fontSize: 16, color: '#18181B' },
  datesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  durationText: { marginTop: 8, fontSize: 13, color: '#71717A' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceTotalRow: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
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
