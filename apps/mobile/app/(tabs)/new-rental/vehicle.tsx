import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { VehicleDto } from '@rentapp/shared';
import { VehicleStatus } from '@rentapp/shared';

import { WizardStepper } from '@/components/WizardStepper';
import { SearchBar } from '@/components/SearchBar';
import { AppCard } from '@/components/AppCard';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { useRentalDraftStore } from '@/stores/rental-draft.store';
import { useVehicles } from '@/hooks/use-vehicles';

const WIZARD_LABELS = ['Klient', 'Pojazd', 'Daty', 'Umowa', 'Podpisy'];

export default function VehicleStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useRentalDraftStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(true);

  const { data: vehicles, isLoading } = useVehicles();

  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    let result = vehicles;

    if (availableOnly) {
      result = result.filter((v) => v.status === VehicleStatus.AVAILABLE);
    }

    if (searchQuery.length >= 2) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.registration.toLowerCase().includes(query) ||
          v.make.toLowerCase().includes(query) ||
          v.model.toLowerCase().includes(query),
      );
    }

    return result;
  }, [vehicles, availableOnly, searchQuery]);

  const handleSelectVehicle = useCallback(
    (vehicle: VehicleDto) => {
      if (availableOnly && vehicle.status !== VehicleStatus.AVAILABLE) return;

      const label = `${vehicle.registration} ${vehicle.make} ${vehicle.model}`;
      draft.updateDraft({ vehicleId: vehicle.id, vehicleLabel: label, step: 2 });
      router.push('/(tabs)/new-rental/dates');
    },
    [availableOnly, draft, router],
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <WizardStepper
        currentStep={2}
        totalSteps={5}
        labels={WIZARD_LABELS}
      />

      <Text className="mt-4 px-4 text-xl font-semibold text-zinc-900">
        {t('wizard.step2')}
      </Text>

      <View className="mt-4">
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('wizard.vehicleSearch')}
        />
      </View>

      <View className="mx-4 mt-3 flex-row items-center justify-between">
        <Text className="text-base text-zinc-900">
          {t('wizard.availableOnly')}
        </Text>
        <Switch
          value={availableOnly}
          onValueChange={setAvailableOnly}
          trackColor={{ false: '#D4D4D8', true: '#93C5FD' }}
          thumbColor={availableOnly ? '#2563EB' : '#A1A1AA'}
        />
      </View>

      <FlatList
        className="mt-3 flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        data={filteredVehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelectable =
            !availableOnly || item.status === VehicleStatus.AVAILABLE;

          return (
            <AppCard
              className={`mb-3 ${!isSelectable ? 'opacity-50' : ''}`}
              onPress={isSelectable ? () => handleSelectVehicle(item) : undefined}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-zinc-900">
                    {item.registration}
                  </Text>
                  <Text className="mt-1 text-[13px] text-zinc-500">
                    {item.make} {item.model}, {item.year}
                  </Text>
                </View>
                <StatusBadge status={item.status} />
              </View>
            </AppCard>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              heading={t('empty.noVehicle')}
              body={t('empty.noVehicleBody')}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}
