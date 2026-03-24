import React, { useState, useCallback } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useReturnDraftStore } from '@/stores/return-draft.store';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { useTranslation } from 'react-i18next';

export default function ReturnLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useReturnDraftStore();
  const [showDiscard, setShowDiscard] = useState(false);

  const hasDraftData =
    !!draft.rentalId || draft.returnMileage != null || draft.notes !== '';

  const handleBeforeRemove = useCallback(
    (e: { preventDefault: () => void; data: { action: unknown } }) => {
      if (!hasDraftData) return;
      e.preventDefault();
      setShowDiscard(true);
    },
    [hasDraftData],
  );

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          presentation: 'modal',
        }}
      >
        <Stack.Screen
          name="[rentalId]"
          listeners={{
            beforeRemove: handleBeforeRemove,
          }}
        />
        <Stack.Screen name="mileage" />
        <Stack.Screen name="checklist" />
        <Stack.Screen name="notes" />
        <Stack.Screen name="confirm" />
      </Stack>

      <ConfirmationDialog
        visible={showDiscard}
        title={t('confirm.discardDraftTitle')}
        body={t('confirm.discardDraftBody')}
        confirmLabel={t('confirm.discard')}
        cancelLabel={t('confirm.continue')}
        variant="destructive"
        onConfirm={() => {
          setShowDiscard(false);
          draft.clearDraft();
          router.back();
        }}
        onCancel={() => setShowDiscard(false)}
      />
    </>
  );
}
