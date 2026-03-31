import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  // The two signatureTypes to upload for this step (page1 + page2 reuse same signature)
  signatureTypes: [SignatureType, SignatureType];
  signerRole: 'customer' | 'employee';
}

// Reduced to 2 user-facing steps. Each signature is uploaded twice (page1 + page2)
// so the backend receives all 4 required types and generates the PDF correctly.
const SIGNATURE_STEPS: SignatureStep[] = [
  {
    titleKey: 'signatures.customerContract',
    signatureTypes: ['customer_page1', 'customer_page2'],
    signerRole: 'customer',
  },
  {
    titleKey: 'signatures.employeeContract',
    signatureTypes: ['employee_page1', 'employee_page2'],
    signerRole: 'employee',
  },
];

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
  const [failedPhotos, setFailedPhotos] = useState<Record<string, string>>({});

  const createRental = useCreateRental();
  const createContract = useCreateContract();
  const signContract = useSignContract();

  // Guard against duplicate rental creation on rapid re-tap
  const isCreatingRef = useRef(false);

  // Read rentalId, contractId, and currentSignatureIndex from persisted store
  const rentalId = draft.rentalId;
  const contractId = draft.contractId;
  const currentIndex = draft.currentSignatureIndex;

  const currentStep = SIGNATURE_STEPS[currentIndex];

  // Safety net: restore portrait when this screen unmounts
  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    };
  }, []);

  const doCreateRentalAndContract = useCallback(async (override: boolean) => {
    if (isCreatingRef.current) return { rentalId: rentalId!, contractId: contractId! };
    isCreatingRef.current = true;

    try {
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
      });
      draft.updateDraft({ rentalId: rental.id });

      // Create contract linked to rental
      const contract = await createContract.mutateAsync({
        rentalId: rental.id,
        rodoConsentAt: draft.rodoTimestamp!,
      });
      draft.updateDraft({ contractId: contract.id });

      return { rentalId: rental.id, contractId: contract.id };
    } catch (err) {
      isCreatingRef.current = false;
      throw err;
    }
  }, [createRental, createContract, draft, rentalId, contractId]);

  const handleCreateRentalAndContract = useCallback(async () => {
    try {
      return await doCreateRentalAndContract(false);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        // Vehicle conflict -- ask user to confirm override
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
        // On the first signature, create rental + contract
        let activeRentalId = rentalId;
        let activeContractId = contractId;

        if (currentIndex === 0 && !activeContractId) {
          try {
            const result = await handleCreateRentalAndContract();
            activeRentalId = result.rentalId;
            activeContractId = result.contractId;
          } catch (err: any) {
            console.error('Rental creation error:', JSON.stringify(err?.response?.data ?? err?.message ?? err));
            Toast.show({
              type: 'error',
              text1: t('errors.rentalCreationFailed'),
              text2: err?.response?.data?.message ?? err?.message ?? 'Unknown error',
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

        // Upload both signature types for this step (page1 + page2 reuse the same signature)
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
        if (currentIndex < SIGNATURE_STEPS.length - 1) {
          draft.updateDraft({ currentSignatureIndex: currentIndex + 1 });
        } else {
          // All signatures done -- finalize
          setIsSubmitting(true);

          // Upload walkthrough photos (non-blocking, per-photo error tracking)
          if (activeRentalId && Object.keys(draft.photoUris).length > 0) {
            try {
              const walkthrough = await apiClient.post('/walkthroughs', {
                rentalId: activeRentalId,
                type: 'HANDOVER',
              });
              const photoFailures: Record<string, string> = {};
              for (const [position, uri] of Object.entries(draft.photoUris)) {
                try {
                  const formData = new FormData();
                  formData.append('file', {
                    uri,
                    name: `${position}.jpg`,
                    type: 'image/jpeg',
                  } as any);
                  formData.append('position', position);
                  await apiClient.post(
                    `/walkthroughs/${walkthrough.data.id}/photos`,
                    formData,
                    { headers: { 'Content-Type': 'multipart/form-data' } },
                  );
                } catch (photoError) {
                  console.warn(`Photo upload failed for ${position}:`, photoError);
                  photoFailures[position] = uri;
                }
              }
              setFailedPhotos(photoFailures);
              if (Object.keys(photoFailures).length > 0) {
                Toast.show({
                  type: 'info',
                  text1: `${Object.keys(photoFailures).length} zdjec nie zostalo wyslanych. Mozesz dodac je pozniej.`,
                });
              } else {
                await apiClient.post(`/walkthroughs/${walkthrough.data.id}/submit`);
              }
            } catch (walkthroughError) {
              console.warn('Walkthrough creation failed:', walkthroughError);
              Toast.show({
                type: 'info',
                text1: 'Zdjecia nie zostaly wyslane',
                text2: 'Mozesz dodac je pozniej',
              });
            }
          }

          draft.clearDraft();
          Toast.show({
            type: 'success',
            text1: t('toasts.rentalCreated'),
          });
          // Restore portrait before navigating away from signatures
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.PORTRAIT_UP,
          );
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
      rentalId,
      contractId,
      draft,
      signContract,
      handleCreateRentalAndContract,
      router,
      t,
    ],
    // rentalId and contractId derived from draft store
  );

  const handleBack = useCallback(async () => {
    if (currentIndex > 0) {
      draft.updateDraft({ currentSignatureIndex: currentIndex - 1 });
    } else {
      // Restore portrait before leaving signatures screen
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
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
        title={t(currentStep.titleKey)}
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
