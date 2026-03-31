import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useReturnDraftStore } from '@/stores/return-draft.store';
import { WizardStepper } from '@/components/WizardStepper';
import { AppButton } from '@/components/AppButton';
import { colors, fonts, spacing } from '@/lib/theme';

export default function ReturnNotesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const draftNotes = useReturnDraftStore((s) => s.notes);
  const updateDraft = useReturnDraftStore((s) => s.updateDraft);

  const [notes, setNotes] = useState(draftNotes ?? '');

  const handleNext = () => {
    updateDraft({ notes, step: 4 });
    router.push('/return/confirm');
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.padWrap}>
        <WizardStepper currentStep={4} totalSteps={5} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex1}>
      <ScrollView
        style={s.flex1}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.stepTitle}>{t('returnWizard.step4')}</Text>

        <TextInput
          style={s.textArea}
          placeholder={t('returnWizard.notesPlaceholder')}
          placeholderTextColor={colors.warmGray}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom button */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <AppButton title={t('common.next')} fullWidth onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  flex1: { flex: 1 },
  padWrap: { paddingHorizontal: spacing.base, paddingTop: 8 },
  scrollContent: { paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: 128 },
  stepTitle: { marginBottom: spacing.base, fontFamily: fonts.display, fontSize: 20, fontWeight: '600', color: colors.charcoal },
  textArea: {
    minHeight: 160,
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
