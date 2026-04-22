import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ScreenOrientation from 'expo-screen-orientation';
import Toast from 'react-native-toast-message';
import type { SignatureType } from '@rentapp/shared';

import { SignatureScreen } from '@/components/SignatureScreen';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { useRentalDraftStore } from '@/stores/rental-draft.store';
import { useCreateRental } from '@/hooks/use-rentals';
import { useCreateContract, useSignContract } from '@/hooks/use-contracts';
import apiClient from '@/api/client';
import { DEFAULT_VAT_RATE } from '@/lib/constants';

interface SignatureStep {
  titleKey: string;
  label: string;
  signatureTypes: [SignatureType, SignatureType];
  signerRole: 'customer' | 'employee';
}

const BASE_SIGNATURE_STEPS: SignatureStep[] = [
  {
    titleKey: 'signatures.customerContract',
    label: 'Podpis Klienta',
    signatureTypes: ['customer_page1', 'customer_page2'],
    signerRole: 'customer',
  },
  {
    titleKey: 'signatures.employeeContract',
    label: 'Podpis Pracownika',
    signatureTypes: ['employee_page1', 'employee_page2'],
    signerRole: 'employee',
  },
];

const SECOND_DRIVER_STEP: SignatureStep = {
  titleKey: 'signatures.secondDriverContract',
  label: 'Podpis Drugiego Kierowcy',
  signatureTypes: ['second_customer_page1', 'second_customer_page2'],
  signerRole: 'customer',
};

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function SignaturesStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useRentalDraftStore();
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [conflictCallback, setConflictCallback] = useState<(() => void) | null>(null);

  const createRental = useCreateRental();
  const createContract = useCreateContract();
  const signContract = useSignContract();

  const isCreatingRef = useRef(false);

  const rentalId = draft.rentalId;
  const contractId = draft.contractId;
  const currentIndex = draft.currentSignatureIndex;

  // Build signature steps dynamically based on second driver
  const hasSecondDriver = draft.secondDriverId !== null || draft.secondDriver !== null;
  const signatureSteps = useMemo<SignatureStep[]>(() => {
    if (hasSecondDriver) {
      return [BASE_SIGNATURE_STEPS[0], SECOND_DRIVER_STEP, BASE_SIGNATURE_STEPS[1]];
    }
    return BASE_SIGNATURE_STEPS;
  }, [hasSecondDriver]);

  const currentStep = signatureSteps[currentIndex];

  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  const doCreateRentalAndContract = useCallback(
    async (override: boolean) => {
      if (rentalId && contractId) return { rentalId, contractId };
      if (isCreatingRef.current) return { rentalId: rentalId!, contractId: contractId! };
      isCreatingRef.current = true;

      try {
        let activeRentalId = rentalId;

        if (!activeRentalId) {
          // Create rental first
          const rental = await createRental.mutateAsync({
            vehicleId: draft.vehicleId!,
            customerId: draft.customerId!,
            startDate: draft.startDate!,
            endDate: draft.endDate!,
            dailyRateNet: draft.dailyRateNet!,
            vatRate: DEFAULT_VAT_RATE,
            overrideConflict: override,
            status: 'DRAFT',
            isCompanyRental: draft.isCompanyRental ?? false,
            companyNip: draft.companyNip ?? undefined,
            vatPayerStatus:
              (draft.vatPayerStatus as 'FULL_100' | 'HALF_50' | 'NONE' | null) ?? undefined,
            insuranceCaseNumber: draft.insuranceCaseNumber ?? undefined,
            pickupLocation: draft.pickupLocation ?? undefined,
            returnLocation: draft.returnLocation ?? undefined,
            dailyKmLimit: draft.dailyKmLimit ?? undefined,
            excessKmRate: draft.excessKmRate ?? undefined,
            deposit: draft.deposit ?? undefined,
            returnDeadlineHour: draft.returnDeadlineHour ?? undefined,
            lateReturnPenalty: draft.lateReturnPenalty ?? undefined,
            fuelLevelRequired: draft.fuelLevelRequired ?? undefined,
            fuelCharge: draft.fuelCharge ?? undefined,
            crossBorderAllowed: draft.crossBorderAllowed,
            dirtyReturnFee: draft.dirtyReturnFee ?? undefined,
            deductible: draft.deductible ?? undefined,
            deductibleWaiverFee: draft.deductibleWaiverFee ?? undefined,
          });
          activeRentalId = rental.id;
          draft.updateDraft({ rentalId: rental.id });
        }

        if (draft.secondDriver && !draft.secondDriverId) {
          const { data } = await apiClient.post(`/rentals/${activeRentalId}/driver`, {
            firstName: draft.secondDriver.firstName,
            lastName: draft.secondDriver.lastName,
            pesel: draft.secondDriver.pesel,
            idNumber: draft.secondDriver.idNumber,
            licenseNumber: draft.secondDriver.licenseNumber,
            licenseCategory: draft.secondDriver.licenseCategory || 'B',
            street: draft.secondDriver.street,
            houseNumber: draft.secondDriver.houseNumber,
            postalCode: draft.secondDriver.postalCode,
            city: draft.secondDriver.city,
            phone: draft.secondDriver.phone,
          });
          draft.updateDraft({ secondDriverId: data.id });
        }

        // PATCH rental terms if worker customized them or added notes
        if (draft.rentalTerms || draft.termsNotes) {
          try {
            await apiClient.patch(`/rentals/${activeRentalId}/terms`, {
              rentalTerms: draft.rentalTerms ?? undefined,
              termsNotes: draft.termsNotes ?? undefined,
            });
          } catch (termsErr) {
            console.warn('Failed to patch rental terms:', termsErr);
            // Non-blocking: continue with contract creation
          }
        }

        // Create contract linked to rental, including termsAcceptedAt
        const contract = await createContract.mutateAsync({
          rentalId: activeRentalId,
          rodoConsentAt: draft.rodoTimestamp!,
          termsAcceptedAt: draft.termsAcceptedAt ?? undefined,
        });
        draft.updateDraft({ contractId: contract.id });
        isCreatingRef.current = false;

        return { rentalId: activeRentalId, contractId: contract.id };
      } catch (err) {
        isCreatingRef.current = false;
        throw err;
      }
    },
    [createRental, createContract, draft, rentalId, contractId],
  );

  const handleCreateRentalAndContract = useCallback(async () => {
    try {
      return await doCreateRentalAndContract(false);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        return new Promise<{ rentalId: string; contractId: string }>((resolve, reject) => {
          setConflictCallback(() => async () => {
            try {
              const result = await doCreateRentalAndContract(true);
              resolve(result);
            } catch (retryErr) {
              reject(retryErr);
            }
          });
          setShowConflict(true);
        });
      }
      throw err;
    }
  }, [doCreateRentalAndContract]);

  const handleSignatureConfirm = useCallback(
    async (base64Png: string) => {
      setIsUploading(true);

      try {
        let activeRentalId = rentalId;
        let activeContractId = contractId;

        if (currentIndex === 0 && !activeContractId) {
          try {
            const result = await handleCreateRentalAndContract();
            activeRentalId = result.rentalId;
            activeContractId = result.contractId;
          } catch (err: any) {
            console.error(
              'Rental creation error:',
              JSON.stringify(err?.response?.data ?? err?.message ?? err),
            );
            const errMsg = JSON.stringify(err?.response?.data ?? err?.message ?? 'Unknown');
            Toast.show({
              type: 'error',
              text1: 'Blad tworzenia najmu',
              text2: errMsg.slice(0, 200),
              visibilityTime: 15000,
            });
            setIsUploading(false);
            return;
          }
        }

        if (!activeContractId) {
          Toast.show({
            type: 'error',
            text1: t('errors.rentalCreationFailed'),
          });
          setIsUploading(false);
          return;
        }

        // Upload both signature types for this step
        for (const sigType of currentStep.signatureTypes) {
          let uploaded = false;
          for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
              await signContract.mutateAsync({
                contractId: activeContractId,
                data: {
                  signatureType: sigType,
                  signatureBase64: base64Png,
                  deviceInfo: 'mobile-app',
                },
              });
              uploaded = true;
              break;
            } catch {
              if (attempt < MAX_RETRIES - 1) {
                await sleep(RETRY_DELAYS[attempt]);
              }
            }
          }

          if (!uploaded) {
            Toast.show({
              type: 'error',
              text1: t('errors.signatureUploadFailed'),
            });
            setIsUploading(false);
            return;
          }
        }

        // Store signature reference
        const updatedSignatures = [...draft.signatures, base64Png.slice(0, 50)];
        draft.updateDraft({ signatures: updatedSignatures });

        // Move to next signature or finalize
        if (currentIndex < signatureSteps.length - 1) {
          draft.updateDraft({ currentSignatureIndex: currentIndex + 1 });
        } else {
          // All signatures done -- finalize
          setIsSubmitting(true);

          draft.clearDraft();
          Toast.show({
            type: 'success',
            text1: t('toasts.rentalCreated'),
          });
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
          router.replace({
            pathname: '/(tabs)/new-rental/success',
            params: {
              contractId: activeContractId,
              rentalId: activeRentalId ?? '',
            },
          });
        }
      } finally {
        setIsUploading(false);
        setIsSubmitting(false);
      }
    },
    [
      currentIndex,
      currentStep,
      signatureSteps,
      rentalId,
      contractId,
      draft,
      signContract,
      handleCreateRentalAndContract,
      router,
      t,
    ],
  );

  const handleBack = useCallback(async () => {
    if (currentIndex > 0) {
      draft.updateDraft({ currentSignatureIndex: currentIndex - 1 });
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      router.back();
    }
  }, [currentIndex, draft, router]);

  const handleConflictConfirm = useCallback(() => {
    setShowConflict(false);
    if (conflictCallback) {
      conflictCallback();
      setConflictCallback(null);
    }
  }, [conflictCallback]);

  const handleConflictCancel = useCallback(() => {
    setShowConflict(false);
    setConflictCallback(null);
  }, []);

  if (!currentStep) return null;

  return (
    <>
      <SignatureScreen
        title={t(currentStep.titleKey, { defaultValue: currentStep.label })}
        stepLabel={t('signatures.stepCounter', {
          current: currentIndex + 1,
        })}
        instruction={t('signatures.instruction')}
        onConfirm={handleSignatureConfirm}
        onBack={handleBack}
        loading={isUploading || isSubmitting}
      />
      <ConfirmationDialog
        visible={showConflict}
        title={t('errors.vehicleConflictTitle')}
        body={t('errors.vehicleConflictBody')}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConflictConfirm}
        onCancel={handleConflictCancel}
      />
    </>
  );
}
