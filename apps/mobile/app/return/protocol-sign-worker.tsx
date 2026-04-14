import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { useReturnDraftStore, useReturnDraftHasHydrated } from '@/stores/return-draft.store';
import { SignatureScreen } from '@/components/SignatureScreen';

export default function ProtocolSignWorkerScreen() {
  const router = useRouter();
  const hasHydrated = useReturnDraftHasHydrated();
  const rentalId = useReturnDraftStore((s) => s.rentalId);
  const updateDraft = useReturnDraftStore((s) => s.updateDraft);

  useEffect(() => {
    if (hasHydrated && !rentalId) {
      router.replace('/(tabs)/rentals');
    }
  }, [hasHydrated, rentalId, router]);

  if (!hasHydrated || !rentalId) return null;

  return (
    <SignatureScreen
      title="Podpis odbierajacego"
      stepLabel="Krok 7 z 8"
      instruction="Pracownik podpisuje protokol zwrotu"
      onConfirm={(base64) => {
        updateDraft({ protocolWorkerSignature: base64, step: 7 });
        router.push('/return/confirm');
      }}
      onBack={() => router.back()}
    />
  );
}
