import React, { useState, useCallback } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useRentalDraftStore } from '@/stores/rental-draft.store';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { useTranslation } from 'react-i18next';

export default function NewRentalLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useRentalDraftStore();
  const [showDiscard, setShowDiscard] = useState(false);

  const hasDraftData =
    !!draft.customerId || !!draft.vehicleId || !!draft.startDate;

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
        }}
      >
        <Stack.Screen
          name="index"
          listeners={{
            beforeRemove: handleBeforeRemove,
          }}
        />
        <Stack.Screen
          name="vehicle"
          listeners={{
            beforeRemove: handleBeforeRemove,
          }}
        />
        <Stack.Screen
          name="dates"
          listeners={{
            beforeRemove: handleBeforeRemove,
          }}
        />
        <Stack.Screen
          name="contract"
          listeners={{
            beforeRemove: handleBeforeRemove,
          }}
        />
        <Stack.Screen
          name="photos"
          listeners={{
            beforeRemove: handleBeforeRemove,
          }}
        />
        <Stack.Screen
          name="signatures"
          listeners={{
            beforeRemove: handleBeforeRemove,
          }}
        />
        <Stack.Screen
          name="success"
          options={{
            gestureEnabled: false,
          }}
        />
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
