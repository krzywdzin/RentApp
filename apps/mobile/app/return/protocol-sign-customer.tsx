import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { useReturnDraftStore, useReturnDraftHasHydrated } from '@/stores/return-draft.store';
import { SignatureScreen } from '@/components/SignatureScreen';

export default function ProtocolSignCustomerScreen() {
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
      title="Podpis zdajacego"
      stepLabel="Krok 6 z 8"
      instruction="Klient podpisuje protokol zwrotu"
      onConfirm={(base64) => {
        updateDraft({ protocolCustomerSignature: base64, step: 6 });
        router.push('/return/protocol-sign-worker');
      }}
      onBack={() => router.back()}
    />
  );
}
