import React, { useState, useCallback, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useRentalDraftStore } from '@/stores/rental-draft.store';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '@/lib/theme';

export default function NewRentalLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useRentalDraftStore();
  const [showDiscard, setShowDiscard] = useState(false);
  const pendingAction = useRef<unknown>(null);

  const hasDraftData =
    !!draft.customerId || !!draft.vehicleId || !!draft.startDate;

  // Confirm discard tylko gdy użytkownik opuszcza WIZARDA w całości (pop z
  // ekranu startowego `index` z aktywnym szkicem). Nawigacja wstecz pomiędzy
  // krokami (vehicle → index, dates → vehicle, itd.) nie wyzwala dialogu,
  // dzięki czemu można swobodnie poprawić dane bez resetu szkicu.
  const handleRootBeforeRemove = useCallback(
    (e: {
      preventDefault: () => void;
      data: { action: unknown };
    }) => {
      if (!hasDraftData) return;
      e.preventDefault();
      pendingAction.current = e.data.action;
      setShowDiscard(true);
    },
    [hasDraftData],
  );

  const handleDiscardConfirm = useCallback(() => {
    setShowDiscard(false);
    draft.clearDraft();
    pendingAction.current = null;
    router.back();
  }, [draft, router]);

  const handleDiscardCancel = useCallback(() => {
    setShowDiscard(false);
    pendingAction.current = null;
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          headerStyle: { backgroundColor: colors.cream, elevation: 0, shadowOpacity: 0 },
          headerTitleStyle: { fontFamily: fonts.display, fontSize: 20, fontWeight: '600', color: colors.charcoal },
          headerTintColor: colors.forestGreen,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="index"
          listeners={{
            beforeRemove: handleRootBeforeRemove,
          }}
        />
        <Stack.Screen name="vehicle" />
        <Stack.Screen name="dates" />
        <Stack.Screen name="contract" />
        <Stack.Screen name="photos" />
        <Stack.Screen name="signatures" />
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
        onConfirm={handleDiscardConfirm}
        onCancel={handleDiscardCancel}
      />
    </>
  );
}
