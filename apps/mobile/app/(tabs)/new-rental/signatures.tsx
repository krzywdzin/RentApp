import React, { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import type { SignatureType } from '@rentapp/shared';

import { SignatureScreen } from '@/components/SignatureScreen';
import { useRentalDraftStore } from '@/stores/rental-draft.store';
import { useCreateRental } from '@/hooks/use-rentals';
import { useCreateContract, useSignContract } from '@/hooks/use-contracts';
import apiClient from '@/api/client';

interface SignatureStep {
  titleKey: string;
  signatureType: SignatureType;
  signerRole: 'customer' | 'employee';
}

const SIGNATURE_STEPS: SignatureStep[] = [
  {
    titleKey: 'signatures.customerContract',
    signatureType: 'customer_page1',
    signerRole: 'customer',
  },
  {
    titleKey: 'signatures.employeeContract',
    signatureType: 'employee_page1',
    signerRole: 'employee',
  },
  {
    titleKey: 'signatures.customerConditions',
    signatureType: 'customer_page2',
    signerRole: 'customer',
  },
  {
    titleKey: 'signatures.employeeConditions',
    signatureType: 'employee_page2',
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createRental = useCreateRental();
  const createContract = useCreateContract();
  const signContract = useSignContract();

  // Store rentalId and contractId across signatures
  const [rentalId, setRentalId] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);

  const currentStep = SIGNATURE_STEPS[currentIndex];

  const handleCreateRentalAndContract = useCallback(async () => {
    // Create rental first
    const rental = await createRental.mutateAsync({
      vehicleId: draft.vehicleId!,
      customerId: draft.customerId!,
      startDate: draft.startDate!,
      endDate: draft.endDate!,
      dailyRateNet: draft.dailyRateNet!,
      vatRate: 23,
      overrideConflict: true,
      status: 'DRAFT',
    });
    setRentalId(rental.id);

    // Create contract linked to rental
    const contract = await createContract.mutateAsync({
      rentalId: rental.id,
      rodoConsentAt: draft.rodoTimestamp!,
    });
    setContractId(contract.id);

    return { rentalId: rental.id, contractId: contract.id };
  }, [createRental, createContract, draft]);

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

        // Upload signature with retry
        let uploaded = false;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            await signContract.mutateAsync({
              contractId: activeContractId,
              data: {
                signatureType: currentStep.signatureType,
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

        // Store signature reference
        const updatedSignatures = [...draft.signatures, base64Png.slice(0, 50)];
        draft.updateDraft({ signatures: updatedSignatures });

        // Move to next signature or finalize
        if (currentIndex < SIGNATURE_STEPS.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          // All signatures done -- finalize
          setIsSubmitting(true);

          // Upload walkthrough photos (non-blocking)
          if (activeRentalId && Object.keys(draft.photoUris).length > 0) {
            try {
              const walkthrough = await apiClient.post('/walkthroughs', {
                rentalId: activeRentalId,
                type: 'HANDOVER',
              });
              for (const [position, uri] of Object.entries(draft.photoUris)) {
                const formData = new FormData();
                formData.append('photo', {
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
              }
              await apiClient.post(`/walkthroughs/${walkthrough.data.id}/submit`);
            } catch (photoError) {
              console.warn('Photo upload failed:', photoError);
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
  );

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      router.back();
    }
  }, [currentIndex, router]);

  if (!currentStep) return null;

  return (
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
  );
}
