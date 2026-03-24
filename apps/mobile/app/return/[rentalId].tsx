import React, { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useRental } from '@/hooks/use-rentals';
import { useReturnDraftStore } from '@/stores/return-draft.store';
import { formatDate, formatMileage } from '@/lib/format';
import { WizardStepper } from '@/components/WizardStepper';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

export default function ReturnConfirmRentalScreen() {
  const { rentalId } = useLocalSearchParams<{ rentalId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: rental, isLoading } = useRental(rentalId ?? '');
  const updateDraft = useReturnDraftStore((s) => s.updateDraft);

  useEffect(() => {
    if (rentalId) {
      updateDraft({ rentalId, step: 1 });
    }
  }, [rentalId, updateDraft]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-4 pt-4">
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
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-base text-zinc-500">
            {!rental
              ? 'Nie znaleziono wynajmu'
              : 'Wynajem nie moze byc zwrocony (status: ' +
                rental.status +
                ')'}
          </Text>
          <AppButton
            title={t('common.back')}
            variant="secondary"
            className="mt-4"
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-2">
        <WizardStepper currentStep={1} totalSteps={5} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 pb-32"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-4 text-xl font-semibold text-zinc-900">
          {t('returnWizard.step1')}
        </Text>

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
                {formatDate(rental.startDate)}
              </Text>
            </View>
            <View>
              <Text className="text-[13px] text-zinc-500">Do</Text>
              <Text className="text-base text-zinc-900">
                {formatDate(rental.endDate)}
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Status */}
        <AppCard className="mb-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-[13px] font-medium text-zinc-500">
              Status
            </Text>
            <StatusBadge status={rental.status} />
          </View>
        </AppCard>
      </ScrollView>

      {/* Bottom button */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-zinc-200 bg-white px-4 pb-8 pt-4">
        <AppButton
          title={t('common.next')}
          fullWidth
          onPress={() => router.push('/return/mileage')}
        />
      </View>
    </SafeAreaView>
  );
}
