import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SecondDriverData {
  firstName: string;
  lastName: string;
  pesel: string;
  idNumber: string;
  licenseNumber: string;
  licenseCategory: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  phone: string;
}

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
  rentalId: string | null;
  contractId: string | null;
  currentSignatureIndex: number;
  isCompanyRental: boolean;
  companyNip: string | null;
  vatPayerStatus: string | null; // 'FULL_100' | 'HALF_50' | 'NONE'
  isInsuranceRental: boolean;
  insuranceCaseNumber: string | null;
  rentalTerms: string | null;
  termsNotes: string | null;
  termsAcceptedAt: string | null;
  secondDriver: SecondDriverData | null;
  secondDriverId: string | null;
  secondDriverCepikStatus: string | null;
  pickupLocation: { address: string; placeId: string } | null;
  returnLocation: { address: string; placeId: string } | null;
  idCardScan: { frontUri: string; backUri: string | null; confirmed: boolean } | null;
  driverLicenseScan: { frontUri: string; backUri: string | null; confirmed: boolean } | null;
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
  rentalId: null,
  contractId: null,
  currentSignatureIndex: 0,
  isCompanyRental: false,
  companyNip: null,
  vatPayerStatus: null,
  isInsuranceRental: false,
  insuranceCaseNumber: null,
  rentalTerms: null,
  termsNotes: null,
  termsAcceptedAt: null,
  secondDriver: null,
  secondDriverId: null,
  secondDriverCepikStatus: null,
  pickupLocation: null,
  returnLocation: null,
  idCardScan: null,
  driverLicenseScan: null,
};

/**
 * Hook to track whether the persisted store has finished hydrating from AsyncStorage.
 * Wizard screens must gate navigation redirects on this to avoid
 * false redirects before draft data is loaded from storage.
 */
export function useRentalDraftHasHydrated(): boolean {
  const [hydrated, setHydrated] = useState(
    useRentalDraftStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsub = useRentalDraftStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    return () => {
      unsub();
    };
  }, []);

  return hydrated;
}

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
