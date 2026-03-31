import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { colors, fonts, spacing } from '@/lib/theme';

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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Hydration guard
  useEffect(() => {
    if (hasHydrated && !rentalId) {
      router.replace('/(tabs)/rentals');
    }
  }, [hasHydrated, rentalId, router]);

  // Create walkthrough on mount if not already created
  const walkthroughCreatedRef = useRef(false);

  const initWalkthrough = useCallback(async () => {
    if (!rentalId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await createWalkthrough(rentalId);
      updateDraft({ walkthroughId: result.id });
    } catch {
      setError('Nie udalo sie zainicjowac inspekcji. Sprobuj ponownie.');
      walkthroughCreatedRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [rentalId, updateDraft]);

  useEffect(() => {
    if (!hasHydrated || !rentalId || walkthroughId || walkthroughCreatedRef.current) return;
    walkthroughCreatedRef.current = true;
    initWalkthrough();
  }, [hasHydrated, rentalId, walkthroughId, initWalkthrough]);

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

  if (loading || error) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.padWrap}>
          <WizardStepper currentStep={3} totalSteps={5} />
        </View>
        <View style={s.loadingWrap}>
          {loading && <ActivityIndicator size="large" color={colors.forestGreen} />}
          {error && (
            <>
              <Text style={s.errorText}>{error}</Text>
              <View style={{ marginTop: 16, width: '60%' }}>
                <AppButton title="Sprobuj ponownie" onPress={initWalkthrough} fullWidth />
              </View>
            </>
          )}
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
            disabled={!walkthroughId}
            onPress={handleNoDamage}
          />
        )}
        {damagePins.length === 0 && <View style={s.buttonSpacer} />}
        <AppButton
          title={t('common.next')}
          fullWidth
          loading={submitting}
          disabled={!walkthroughId}
          onPress={handleNext}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  flex1: { flex: 1 },
  padWrap: { paddingHorizontal: spacing.base, paddingTop: 8 },
  scrollContent: { paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: 200 },
  stepTitle: { marginBottom: spacing.base, fontFamily: fonts.display, fontSize: 20, fontWeight: '600', color: colors.charcoal },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
  errorText: { fontFamily: fonts.body, fontSize: 15, color: colors.terracotta, textAlign: 'center' },
  pinList: { marginTop: spacing.base },
  pinListTitle: { marginBottom: 8, fontFamily: fonts.body, fontSize: 14, fontWeight: '500', color: colors.charcoal },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: colors.warmStone,
    padding: spacing.md,
  },
  pinBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pinBadgeText: { fontFamily: fonts.data, color: colors.cream, fontSize: 13 },
  pinLabel: { fontFamily: fonts.body, fontSize: 15, color: colors.charcoal },
  pinNote: { marginTop: 2, fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  deleteBtn: {
    marginLeft: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { fontFamily: fonts.data, fontSize: 13, color: colors.cream },
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
  buttonSpacer: { height: 8 },
});
