import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RentalDraft {
  step: number;
  customerId: string | null;
  customerName: string | null;
  vehicleId: string | null;
  vehicleLabel: string | null;
  startDate: string | null;
  endDate: string | null;
  dailyRateNet: number | null;
  rodoConsent: boolean;
  rodoTimestamp: string | null;
  signatures: string[];
  photoUris: Record<string, string>;
}

interface RentalDraftState extends RentalDraft {
  setStep: (step: number) => void;
  updateDraft: (partial: Partial<RentalDraft>) => void;
  clearDraft: () => void;
}

const initialDraft: RentalDraft = {
  step: 0,
  customerId: null,
  customerName: null,
  vehicleId: null,
  vehicleLabel: null,
  startDate: null,
  endDate: null,
  dailyRateNet: null,
  rodoConsent: false,
  rodoTimestamp: null,
  signatures: [],
  photoUris: {},
};

export const useRentalDraftStore = create<RentalDraftState>()(
  persist(
    (set) => ({
      ...initialDraft,

      setStep: (step) => set({ step }),

      updateDraft: (partial) => set((state) => ({ ...state, ...partial })),

      clearDraft: () => set(initialDraft),
    }),
    {
      name: 'rental-draft',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
