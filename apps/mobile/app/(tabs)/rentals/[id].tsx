import React from 'react';
import { ScrollView, Text, View } from 'react-native';
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
        <View className="flex-1 bg-white px-4 pt-4">
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
      <View className="flex-1 bg-white">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pt-4 pb-32"
          showsVerticalScrollIndicator={false}
        >
          {/* Status */}
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-[20px] font-semibold text-zinc-900">
              {rental.vehicle.registration}
            </Text>
            <StatusBadge status={rental.status} />
          </View>

          {/* Customer */}
          <AppCard className="mb-3">
            <Text className="mb-2 text-[13px] font-medium text-zinc-500">
              Klient
            </Text>
            <Text className="text-base font-semibold text-zinc-900">
              {rental.customer.firstName} {rental.customer.lastName}
            </Text>
            {rental.customer.phone && (
              <Text className="mt-1 text-[13px] text-zinc-500">
                {rental.customer.phone}
              </Text>
            )}
            {rental.customer.email && (
              <Text className="mt-1 text-[13px] text-zinc-500">
                {rental.customer.email}
              </Text>
            )}
          </AppCard>

          {/* Vehicle */}
          <AppCard className="mb-3">
            <Text className="mb-2 text-[13px] font-medium text-zinc-500">
              Pojazd
            </Text>
            <Text className="text-base font-semibold text-zinc-900">
              {rental.vehicle.registration}
            </Text>
            <Text className="mt-1 text-[13px] text-zinc-500">
              {rental.vehicle.make} {rental.vehicle.model} ({rental.vehicle.year})
            </Text>
            <Text className="mt-1 text-[13px] text-zinc-500">
              Przebieg: {formatMileage(rental.vehicle.mileage)}
            </Text>
          </AppCard>

          {/* Dates */}
          <AppCard className="mb-3">
            <Text className="mb-2 text-[13px] font-medium text-zinc-500">
              Terminy
            </Text>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-[13px] text-zinc-500">Od</Text>
                <Text className="text-base text-zinc-900">
                  {formatDateTime(rental.startDate)}
                </Text>
              </View>
              <View>
                <Text className="text-[13px] text-zinc-500">Do</Text>
                <Text className="text-base text-zinc-900">
                  {formatDateTime(rental.endDate)}
                </Text>
              </View>
            </View>
            <Text className="mt-2 text-[13px] text-zinc-500">
              Czas trwania: {durationDays}{' '}
              {durationDays === 1 ? 'dzien' : 'dni'}
            </Text>
          </AppCard>

          {/* Pricing */}
          <AppCard className="mb-3">
            <Text className="mb-2 text-[13px] font-medium text-zinc-500">
              Ceny
            </Text>
            <View className="flex-row justify-between">
              <Text className="text-[13px] text-zinc-500">
                Stawka dzienna netto
              </Text>
              <Text className="text-base text-zinc-900">
                {formatCurrency(rental.dailyRateNet)}
              </Text>
            </View>
            <View className="mt-2 flex-row justify-between">
              <Text className="text-base font-semibold text-zinc-900">
                Razem brutto
              </Text>
              <Text className="text-base font-semibold text-zinc-900">
                {formatCurrency(rental.totalPriceGross)}
              </Text>
            </View>
          </AppCard>

          {/* Return data (if returned) */}
          {isReturned && rental.returnData && (
            <AppCard className="mb-3">
              <Text className="mb-2 text-[13px] font-medium text-zinc-500">
                Dane zwrotu
              </Text>
              {rental.returnMileage != null && (
                <Text className="text-base text-zinc-900">
                  Przebieg zwrotu: {formatMileage(rental.returnMileage)}
                </Text>
              )}
              {rental.returnData.generalNotes && (
                <Text className="mt-2 text-[13px] text-zinc-500">
                  {rental.returnData.generalNotes}
                </Text>
              )}
            </AppCard>
          )}

          {/* Notes */}
          {rental.notes && (
            <AppCard className="mb-3">
              <Text className="mb-2 text-[13px] font-medium text-zinc-500">
                Uwagi
              </Text>
              <Text className="text-base text-zinc-900">{rental.notes}</Text>
            </AppCard>
          )}
        </ScrollView>

        {/* Action Buttons */}
        {isActiveOrExtended && (
          <View className="absolute bottom-0 left-0 right-0 border-t border-zinc-200 bg-white px-4 pb-8 pt-4">
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
