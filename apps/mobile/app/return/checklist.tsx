import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useReturnDraftStore, useReturnDraftHasHydrated } from '@/stores/return-draft.store';
import { CHECKLIST_ITEMS } from '@/lib/constants';
import { WizardStepper } from '@/components/WizardStepper';
import { AppButton } from '@/components/AppButton';

interface ChecklistState {
  [key: string]: { damaged: boolean; notes: string };
}

export default function ReturnChecklistScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hasHydrated = useReturnDraftHasHydrated();
  const draftChecklist = useReturnDraftStore((s) => s.checklist);
  const updateDraft = useReturnDraftStore((s) => s.updateDraft);
  const rentalId = useReturnDraftStore((s) => s.rentalId);

  const [checklist, setChecklist] = useState<ChecklistState>(() => {
    const initial: ChecklistState = {};
    for (const item of CHECKLIST_ITEMS) {
      initial[item.key] = draftChecklist[item.key] ?? {
        damaged: false,
        notes: '',
      };
    }
    return initial;
  });

  useEffect(() => {
    if (hasHydrated && !rentalId) {
      router.replace('/(tabs)/rentals');
    }
  }, [hasHydrated, rentalId, router]);

  if (!hasHydrated || !rentalId) return null;

  const toggleItem = (key: string) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        damaged: !prev[key].damaged,
        notes: !prev[key].damaged ? prev[key].notes : '',
      },
    }));
  };

  const setItemNotes = (key: string, notes: string) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: { ...prev[key], notes },
    }));
  };

  const handleNext = () => {
    updateDraft({ checklist, step: 3 });
    router.push('/return/notes');
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.padWrap}>
        <WizardStepper currentStep={3} totalSteps={5} />
      </View>

      <ScrollView
        style={s.flex1}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.stepTitle}>{t('returnWizard.step3')}</Text>

        {CHECKLIST_ITEMS.map((item) => {
          const state = checklist[item.key];
          return (
            <View key={item.key} style={s.checkItem}>
              <View style={s.checkRow}>
                <Text style={s.checkLabel}>{item.label}</Text>
                <Switch
                  value={state.damaged}
                  onValueChange={() => toggleItem(item.key)}
                  trackColor={{ false: '#D4D4D8', true: '#DC2626' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {state.damaged && (
                <TextInput
                  style={s.notesInput}
                  placeholder="Opisz uszkodzenie..."
                  placeholderTextColor="#A1A1AA"
                  value={state.notes}
                  onChangeText={(text) => setItemNotes(item.key, text)}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom button */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <AppButton title={t('common.next')} fullWidth onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  flex1: { flex: 1 },
  padWrap: { paddingHorizontal: 16, paddingTop: 8 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 128 },
  stepTitle: { marginBottom: 16, fontSize: 20, fontWeight: '600', color: '#18181B' },
  checkItem: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  checkLabel: { fontSize: 16, color: '#18181B' },
  notesInput: {
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 12,
    fontSize: 16,
    color: '#18181B',
  },
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
});
