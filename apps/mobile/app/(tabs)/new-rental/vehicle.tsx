import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Switch, Text, View } from 'react-native';
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
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useRentalDraftStore } from '@/stores/rental-draft.store';
import { useVehicles } from '@/hooks/use-vehicles';
import { RENTAL_WIZARD_LABELS } from '@/lib/constants';

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

  if (isLoading) {
    return (
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <WizardStepper currentStep={2} totalSteps={6} labels={RENTAL_WIZARD_LABELS} />
        <Text style={s.stepTitle}>{t('wizard.step2')}</Text>
        <View style={s.loadingWrap}>
          <LoadingSkeleton variant="list-item" count={6} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <WizardStepper
        currentStep={2}
        totalSteps={6}
        labels={RENTAL_WIZARD_LABELS}
      />

      <Text style={s.stepTitle}>
        {t('wizard.step2')}
      </Text>

      <View style={s.mt16}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('wizard.vehicleSearch')}
        />
      </View>

      <View style={s.switchRow}>
        <Text style={s.switchLabel}>
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
        style={s.list}
        contentContainerStyle={s.listContent}
        data={filteredVehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelectable =
            !availableOnly || item.status === VehicleStatus.AVAILABLE;

          return (
            <AppCard
              cardStyle={[s.mb12, !isSelectable ? s.dimmed : undefined]}
              onPress={isSelectable ? () => handleSelectVehicle(item) : undefined}
            >
              <View style={s.itemRow}>
                <View style={s.flex1}>
                  <Text style={s.vehReg}>{item.registration}</Text>
                  <Text style={s.vehSub}>
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

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  stepTitle: { marginTop: 16, paddingHorizontal: 16, fontSize: 20, fontWeight: '600', color: '#18181B' },
  mt16: { marginTop: 16 },
  mb12: { marginBottom: 12 },
  switchRow: { marginHorizontal: 16, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: 16, color: '#18181B' },
  list: { marginTop: 12, flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  flex1: { flex: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  vehReg: { fontSize: 16, fontWeight: '600', color: '#18181B' },
  vehSub: { marginTop: 4, fontSize: 13, color: '#71717A' },
  dimmed: { opacity: 0.5 },
  loadingWrap: { paddingHorizontal: 16, paddingTop: 24 },
});
