import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { VehicleDto } from '@rentapp/shared';
import { VehicleStatus } from '@rentapp/shared';

import { WizardStepper } from '@/components/WizardStepper';
import { SearchBar } from '@/components/SearchBar';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { AppSwitch } from '@/components/AppSwitch';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useRentalDraftStore } from '@/stores/rental-draft.store';
import { useVehicles } from '@/hooks/use-vehicles';
import { RENTAL_WIZARD_LABELS } from '@/lib/constants';
import { colors, fonts, spacing } from '@/lib/theme';

export default function VehicleStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useRentalDraftStore();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleDto | null>(null);
  const [isInsurance, setIsInsurance] = useState(draft.isInsuranceRental ?? false);
  const [insuranceCaseNumber, setInsuranceCaseNumber] = useState(draft.insuranceCaseNumber ?? '');

  const { data: vehicles, isLoading } = useVehicles();

  // Restore selection from draft when vehicles arrive
  React.useEffect(() => {
    if (vehicles && draft.vehicleId && !selectedVehicle) {
      const found = vehicles.find((v) => v.id === draft.vehicleId);
      if (found) setSelectedVehicle(found);
    }
  }, [vehicles, draft.vehicleId]);

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
      setSelectedVehicle(vehicle);
    },
    [availableOnly],
  );

  const handleContinue = useCallback(() => {
    if (!selectedVehicle) return;
    const label = `${selectedVehicle.registration} ${selectedVehicle.make} ${selectedVehicle.model}`;
    draft.updateDraft({
      vehicleId: selectedVehicle.id,
      vehicleLabel: label,
      isInsuranceRental: isInsurance,
      insuranceCaseNumber: isInsurance ? (insuranceCaseNumber || null) : null,
      step: 2,
    });
    router.push('/(tabs)/new-rental/dates');
  }, [selectedVehicle, draft, router, isInsurance, insuranceCaseNumber]);

  if (isLoading) {
    return (
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <WizardStepper currentStep={2} totalSteps={6} labels={RENTAL_WIZARD_LABELS} onBack={router.canGoBack() ? router.back : undefined} />
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
        onBack={router.canGoBack() ? router.back : undefined}
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
          trackColor={{ false: colors.sand, true: colors.forestGreen }}
          thumbColor={colors.cream}
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

          const isSelected = selectedVehicle?.id === item.id;

          return (
            <AppCard
              cardStyle={[s.mb12, !isSelectable ? s.dimmed : undefined, isSelected ? s.selectedCard : undefined]}
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
        ListFooterComponent={
          <View style={s.insuranceSection}>
            <AppSwitch
              label="Najem ubezpieczeniowy?"
              value={isInsurance}
              onValueChange={(val) => {
                setIsInsurance(val);
                if (!val) setInsuranceCaseNumber('');
              }}
            />
            {isInsurance && (
              <AppInput
                label="Nr sprawy ubezpieczeniowej"
                value={insuranceCaseNumber}
                onChangeText={setInsuranceCaseNumber}
                placeholder="np. ABC/123/2026"
                containerStyle={s.mt12}
              />
            )}
          </View>
        }
      />

      {/* Bottom CTA */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <AppButton
          title="Dalej"
          onPress={handleContinue}
          disabled={!selectedVehicle}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  stepTitle: { marginTop: spacing.base, paddingHorizontal: spacing.base, fontFamily: fonts.display, fontSize: 20, fontWeight: '600', color: colors.charcoal },
  mt16: { marginTop: spacing.base },
  mb12: { marginBottom: spacing.md },
  switchRow: { marginHorizontal: spacing.base, marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontFamily: fonts.body, fontSize: 16, color: colors.charcoal },
  list: { marginTop: spacing.md, flex: 1 },
  listContent: { paddingHorizontal: spacing.base, paddingBottom: 32 },
  flex1: { flex: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  vehReg: { fontFamily: fonts.data, fontSize: 16, color: colors.charcoal },
  vehSub: { marginTop: 4, fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  dimmed: { opacity: 0.5 },
  selectedCard: { borderWidth: 2, borderColor: colors.forestGreen },
  loadingWrap: { paddingHorizontal: spacing.base, paddingTop: 24 },
  insuranceSection: { marginTop: spacing.lg, paddingBottom: 80 },
  mt12: { marginTop: spacing.md },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: colors.sand,
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.base,
    paddingTop: 12,
  },
});
