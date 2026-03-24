import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
};

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
