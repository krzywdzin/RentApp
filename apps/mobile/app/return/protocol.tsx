import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ProtocolCleanliness } from '@rentapp/shared';

import { useRental } from '@/hooks/use-rentals';
import {
  useReturnDraftStore,
  useReturnDraftHasHydrated,
  RETURN_WIZARD_TOTAL_STEPS,
} from '@/stores/return-draft.store';
import { WizardStepper } from '@/components/WizardStepper';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { colors, fonts, spacing } from '@/lib/theme';

const CLEANLINESS_OPTIONS: { value: ProtocolCleanliness; label: string }[] = [
  { value: 'CZYSTY', label: 'Czysty' },
  { value: 'BRUDNY', label: 'Brudny' },
  { value: 'DO_MYCIA', label: 'Do mycia' },
];

function formatDateTime(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

export default function ReturnProtocolScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hasHydrated = useReturnDraftHasHydrated();

  const rentalId = useReturnDraftStore((s) => s.rentalId);
  const draftCleanliness = useReturnDraftStore((s) => s.protocolCleanliness);
  const draftCleanlinessNote = useReturnDraftStore((s) => s.protocolCleanlinessNote);
  const draftOtherNotes = useReturnDraftStore((s) => s.protocolOtherNotes);
  const updateDraft = useReturnDraftStore((s) => s.updateDraft);

  const { data: rental } = useRental(rentalId ?? '');

  const [cleanliness, setCleanliness] = useState<ProtocolCleanliness | null>(draftCleanliness);
  const [cleanlinessNote, setCleanlinessNote] = useState(draftCleanlinessNote ?? '');
  const [otherNotes, setOtherNotes] = useState(draftOtherNotes ?? '');

  React.useEffect(() => {
    if (hasHydrated && !rentalId) {
      router.replace('/(tabs)/rentals');
    }
  }, [hasHydrated, rentalId, router]);

  if (!hasHydrated || !rentalId) return null;

  const handleChipPress = (value: ProtocolCleanliness) => {
    setCleanliness((prev) => (prev === value ? null : value));
  };

  const handleNext = () => {
    if (!cleanliness) return;
    updateDraft({
      protocolCleanliness: cleanliness,
      protocolCleanlinessNote: cleanlinessNote,
      protocolOtherNotes: otherNotes,
      step: 5,
    });
    router.push('/return/protocol-sign-customer');
  };

  const returnLocationAddress = (() => {
    if (!rental?.returnLocation) return 'Nie podano';
    try {
      const loc =
        typeof rental.returnLocation === 'string'
          ? JSON.parse(rental.returnLocation)
          : rental.returnLocation;
      return (loc as { address?: string }).address || 'Nie podano';
    } catch {
      return 'Nie podano';
    }
  })();

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.padWrap}>
        <WizardStepper currentStep={5} totalSteps={RETURN_WIZARD_TOTAL_STEPS} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex1}>
        <ScrollView
          style={s.flex1}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.stepTitle}>Protokol zwrotu</Text>

          {/* Auto-filled fields */}
          {rental && (
            <AppCard cardStyle={[s.mb16, s.cardStone]}>
              <Text style={s.sectionLabel}>Dane protokolu</Text>

              <Text style={s.fieldLabel}>Zdajacy:</Text>
              <Text style={s.fieldValue}>
                {rental.customer.firstName} {rental.customer.lastName}
              </Text>

              <Text style={[s.fieldLabel, s.mt8]}>Data i godzina zwrotu:</Text>
              <Text style={s.fieldValue}>{formatDateTime(new Date())}</Text>

              <Text style={[s.fieldLabel, s.mt8]}>Marka i model:</Text>
              <Text style={s.fieldValue}>
                {rental.vehicle.make} {rental.vehicle.model}
              </Text>

              <Text style={[s.fieldLabel, s.mt8]}>Nr rejestracyjny:</Text>
              <Text style={s.fieldValue}>{rental.vehicle.registration}</Text>

              <Text style={[s.fieldLabel, s.mt8]}>Miejsce odbioru:</Text>
              <Text style={s.fieldValue}>{returnLocationAddress}</Text>
            </AppCard>
          )}

          {/* Cleanliness chip selector */}
          <Text style={s.sectionLabel}>Czystosc pojazdu</Text>
          <View style={s.chipRow}>
            {CLEANLINESS_OPTIONS.map((opt) => {
              const isSelected = cleanliness === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => handleChipPress(opt.value)}
                  style={[s.chip, isSelected ? s.chipSelected : s.chipUnselected]}
                >
                  <Text style={[s.chipLabel, isSelected ? s.chipLabelSelected : s.chipLabelUnselected]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Cleanliness note (visible when cleanliness selected) */}
          {cleanliness != null && (
            <TextInput
              style={s.singleLineInput}
              placeholder="Uwagi do czystosci (opcjonalne)"
              placeholderTextColor={colors.warmGray}
              value={cleanlinessNote}
              onChangeText={setCleanlinessNote}
            />
          )}

          {/* Other notes */}
          <Text style={[s.sectionLabel, s.mt16]}>Inne</Text>
          <TextInput
            style={s.textArea}
            placeholder="Dodatkowe uwagi (opcjonalne)"
            placeholderTextColor={colors.warmGray}
            value={otherNotes}
            onChangeText={setOtherNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom button */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <AppButton
          title="Dalej"
          fullWidth
          disabled={cleanliness === null}
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
  scrollContent: { paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: 128 },
  stepTitle: {
    marginBottom: spacing.base,
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: '600',
    color: colors.charcoal,
  },
  mb16: { marginBottom: spacing.base },
  mt8: { marginTop: 8 },
  mt16: { marginTop: 16 },
  cardStone: { backgroundColor: colors.warmStone },
  sectionLabel: {
    marginBottom: 8,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.warmGray,
  },
  fieldLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.charcoal,
  },
  fieldValue: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.charcoal,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipUnselected: {
    backgroundColor: colors.warmStone,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  chipSelected: {
    backgroundColor: colors.forestGreen,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  chipLabelUnselected: {
    color: colors.charcoal,
  },
  chipLabelSelected: {
    color: colors.cream,
  },
  singleLineInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
    paddingVertical: 12,
    paddingHorizontal: 0,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.charcoal,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 120,
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
    paddingVertical: 12,
    paddingHorizontal: 0,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.charcoal,
  },
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
