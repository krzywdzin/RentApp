import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { DAMAGE_TYPE_LABELS, type DamagePin, type DamageType } from '@rentapp/shared';

import { useReturnDraftStore, useReturnDraftHasHydrated } from '@/stores/return-draft.store';
import { createWalkthrough, createDamageReport, confirmNoDamage } from '@/api/damage.api';
import { CarDamageMap } from '@/components/CarDamageMap';
import { DamageDetailModal } from '@/components/DamageDetailModal';
import { WizardStepper } from '@/components/WizardStepper';
import { AppButton } from '@/components/AppButton';

export default function ReturnDamageMapScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hasHydrated = useReturnDraftHasHydrated();

  const rentalId = useReturnDraftStore((s) => s.rentalId);
  const walkthroughId = useReturnDraftStore((s) => s.walkthroughId);
  const damagePins = useReturnDraftStore((s) => s.damagePins);
  const updateDraft = useReturnDraftStore((s) => s.updateDraft);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedZone, setSelectedZone] = useState<{ zoneName: string; x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Hydration guard
  useEffect(() => {
    if (hasHydrated && !rentalId) {
      router.replace('/(tabs)/rentals');
    }
  }, [hasHydrated, rentalId, router]);

  // Create walkthrough on mount if not already created
  useEffect(() => {
    if (!hasHydrated || !rentalId || walkthroughId) return;

    let cancelled = false;
    setLoading(true);
    createWalkthrough(rentalId)
      .then((result) => {
        if (!cancelled) {
          updateDraft({ walkthroughId: result.id });
        }
      })
      .catch(() => {
        // Walkthrough creation failed — user can retry by re-entering screen
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, rentalId, walkthroughId, updateDraft]);

  const handleZoneTap = useCallback((zoneName: string, x: number, y: number) => {
    setSelectedZone({ zoneName, x, y });
    setModalVisible(true);
  }, []);

  const handleModalSave = useCallback(
    (damageType: DamageType, note: string) => {
      if (!selectedZone) return;

      const newPin: DamagePin = {
        pinNumber: damagePins.length + 1,
        svgView: 'top',
        x: selectedZone.x,
        y: selectedZone.y,
        damageType,
        severity: 'minor',
        note: note || undefined,
      };

      updateDraft({ damagePins: [...damagePins, newPin] });
      setModalVisible(false);
      setSelectedZone(null);
    },
    [selectedZone, damagePins, updateDraft],
  );

  const handleModalCancel = useCallback(() => {
    setModalVisible(false);
    setSelectedZone(null);
  }, []);

  const handleDeletePin = useCallback(
    (pinNumber: number) => {
      const filtered = damagePins
        .filter((p) => p.pinNumber !== pinNumber)
        .map((p, idx) => ({ ...p, pinNumber: idx + 1 }));
      updateDraft({ damagePins: filtered });
    },
    [damagePins, updateDraft],
  );

  const handleNoDamage = useCallback(async () => {
    if (!walkthroughId) return;
    setSubmitting(true);
    try {
      await confirmNoDamage(walkthroughId);
      updateDraft({ damagePins: [], step: 3 });
      router.push('/return/notes');
    } catch {
      // Error handled silently — user can retry
    } finally {
      setSubmitting(false);
    }
  }, [walkthroughId, updateDraft, router]);

  const handleNext = useCallback(async () => {
    if (!walkthroughId) return;
    setSubmitting(true);
    try {
      if (damagePins.length > 0) {
        await createDamageReport(walkthroughId, damagePins);
      }
      updateDraft({ step: 3 });
      router.push('/return/notes');
    } catch {
      // Error handled silently — user can retry
    } finally {
      setSubmitting(false);
    }
  }, [walkthroughId, damagePins, updateDraft, router]);

  if (!hasHydrated || !rentalId) return null;

  if (loading) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.padWrap}>
          <WizardStepper currentStep={3} totalSteps={5} />
        </View>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.padWrap}>
        <WizardStepper currentStep={3} totalSteps={5} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex1}>
        <ScrollView
          style={s.flex1}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.stepTitle}>{t('returnWizard.step3')}</Text>

          {/* SVG Car Damage Map */}
          <CarDamageMap pins={damagePins} onZoneTap={handleZoneTap} />

          {/* Damage pins list */}
          {damagePins.length > 0 && (
            <View style={s.pinList}>
              <Text style={s.pinListTitle}>Zaznaczone uszkodzenia</Text>
              {damagePins.map((pin) => (
                <View key={pin.pinNumber} style={s.pinRow}>
                  <View style={s.pinBadge}>
                    <Text style={s.pinBadgeText}>{pin.pinNumber}</Text>
                  </View>
                  <View style={s.flex1}>
                    <Text style={s.pinLabel}>
                      {DAMAGE_TYPE_LABELS[pin.damageType]}
                    </Text>
                    {pin.note ? (
                      <Text style={s.pinNote}>{pin.note}</Text>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => handleDeletePin(pin.pinNumber)}
                    hitSlop={8}
                    style={s.deleteBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Usun uszkodzenie"
                  >
                    <Text style={s.deleteBtnText}>X</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Damage Detail Modal */}
      <DamageDetailModal
        visible={modalVisible}
        zoneName={selectedZone?.zoneName ?? ''}
        onSave={handleModalSave}
        onCancel={handleModalCancel}
      />

      {/* Bottom bar with actions */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {damagePins.length === 0 && (
          <AppButton
            title="Brak uszkodzen"
            variant="secondary"
            fullWidth
            loading={submitting}
            onPress={handleNoDamage}
          />
        )}
        {damagePins.length === 0 && <View style={s.buttonSpacer} />}
        <AppButton
          title={t('common.next')}
          fullWidth
          loading={submitting}
          onPress={handleNext}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  flex1: { flex: 1 },
  padWrap: { paddingHorizontal: 16, paddingTop: 8 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 200 },
  stepTitle: { marginBottom: 16, fontSize: 20, fontWeight: '600', color: '#18181B' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pinList: { marginTop: 16 },
  pinListTitle: { marginBottom: 8, fontSize: 14, fontWeight: '600', color: '#18181B' },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FAFAFA',
    padding: 12,
  },
  pinBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pinBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  pinLabel: { fontSize: 15, color: '#18181B' },
  pinNote: { marginTop: 2, fontSize: 13, color: '#71717A' },
  deleteBtn: {
    marginLeft: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  buttonSpacer: { height: 8 },
});
