import React, { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useReturnDraftStore } from '@/stores/return-draft.store';
import { WizardStepper } from '@/components/WizardStepper';
import { AppButton } from '@/components/AppButton';

export default function ReturnNotesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const draftNotes = useReturnDraftStore((s) => s.notes);
  const updateDraft = useReturnDraftStore((s) => s.updateDraft);

  const [notes, setNotes] = useState(draftNotes ?? '');

  const handleNext = () => {
    updateDraft({ notes, step: 4 });
    router.push('/return/confirm');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-2">
        <WizardStepper currentStep={4} totalSteps={5} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 pb-32"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-4 text-xl font-semibold text-zinc-900">
          {t('returnWizard.step4')}
        </Text>

        <TextInput
          className="min-h-[160px] rounded-xl border border-zinc-200 p-4 text-base text-zinc-900"
          placeholder={t('returnWizard.notesPlaceholder')}
          placeholderTextColor="#A1A1AA"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </ScrollView>

      {/* Bottom button */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-zinc-200 bg-white px-4 pb-8 pt-4">
        <AppButton title={t('common.next')} fullWidth onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}
