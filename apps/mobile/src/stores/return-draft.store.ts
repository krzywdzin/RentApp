import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DamagePin } from '@rentapp/shared';

interface ChecklistItem {
  damaged: boolean;
  notes: string;
}

interface ReturnDraft {
  step: number;
  rentalId: string | null;
  returnMileage: number | null;
  checklist: Record<string, ChecklistItem>;
  notes: string;
  walkthroughId: string | null;
  damagePins: DamagePin[];
}

interface ReturnDraftState extends ReturnDraft {
  setStep: (step: number) => void;
  updateDraft: (partial: Partial<ReturnDraft>) => void;
  clearDraft: () => void;
}

const initialDraft: ReturnDraft = {
  step: 0,
  rentalId: null,
  returnMileage: null,
  checklist: {},
  notes: '',
  walkthroughId: null,
  damagePins: [],
};

/**
 * Hook to track whether the persisted store has finished hydrating from AsyncStorage.
 * Return wizard screens must gate navigation redirects on this to avoid
 * false redirects before rentalId is loaded from storage.
 */
export function useReturnDraftHasHydrated(): boolean {
  const [hydrated, setHydrated] = useState(
    useReturnDraftStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsub = useReturnDraftStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    return () => {
      unsub();
    };
  }, []);

  return hydrated;
}

export const useReturnDraftStore = create<ReturnDraftState>()(
  persist(
    (set) => ({
      ...initialDraft,

      setStep: (step) => set({ step }),

      updateDraft: (partial) => set((state) => ({ ...state, ...partial })),

      clearDraft: () => set(initialDraft),
    }),
    {
      name: 'return-draft',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
