import React, { useState, useEffect } from 'react';
import { ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useReturnDraftStore } from '@/stores/return-draft.store';
import { CHECKLIST_ITEMS } from '@/lib/constants';
import { WizardStepper } from '@/components/WizardStepper';
import { AppButton } from '@/components/AppButton';

interface ChecklistState {
  [key: string]: { damaged: boolean; notes: string };
}

export default function ReturnChecklistScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const draftChecklist = useReturnDraftStore((s) => s.checklist);
  const updateDraft = useReturnDraftStore((s) => s.updateDraft);

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

  // Sync draft on mount
  useEffect(() => {
    if (Object.keys(draftChecklist).length > 0) {
      const merged: ChecklistState = {};
      for (const item of CHECKLIST_ITEMS) {
        merged[item.key] = draftChecklist[item.key] ?? {
          damaged: false,
          notes: '',
        };
      }
      setChecklist(merged);
    }
  }, []);

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
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-2">
        <WizardStepper currentStep={3} totalSteps={5} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 pb-32"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-4 text-xl font-semibold text-zinc-900">
          {t('returnWizard.step3')}
        </Text>

        {CHECKLIST_ITEMS.map((item) => {
          const state = checklist[item.key];
          return (
            <View
              key={item.key}
              className="mb-3 rounded-xl border border-zinc-200 bg-white p-4"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-zinc-900">{item.label}</Text>
                <Switch
                  value={state.damaged}
                  onValueChange={() => toggleItem(item.key)}
                  trackColor={{ false: '#D4D4D8', true: '#DC2626' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {state.damaged && (
                <TextInput
                  className="mt-3 rounded-lg border border-zinc-200 p-3 text-base text-zinc-900"
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
      <View className="absolute bottom-0 left-0 right-0 border-t border-zinc-200 bg-white px-4 pb-8 pt-4">
        <AppButton title={t('common.next')} fullWidth onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}
