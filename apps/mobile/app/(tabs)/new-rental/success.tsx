import React, { useCallback } from 'react';
import { Linking, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';

import { AppButton } from '@/components/AppButton';
import { useRentalDraftStore } from '@/stores/rental-draft.store';
import { contractsApi } from '@/api/contracts.api';

export default function SuccessScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { contractId } = useLocalSearchParams<{ contractId?: string }>();
  const draft = useRentalDraftStore();

  const handleViewPdf = useCallback(async () => {
    if (!contractId) return;
    const url = contractsApi.getPdfUrl(contractId);
    try {
      await Linking.openURL(url);
    } catch {
      // Silently fail if URL can't be opened
    }
  }, [contractId]);

  const handleNewRental = useCallback(() => {
    draft.clearDraft();
    router.replace('/(tabs)/new-rental');
  }, [draft, router]);

  const handleBackToHome = useCallback(() => {
    draft.clearDraft();
    router.replace('/(tabs)');
  }, [draft, router]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center px-8">
        {/* Checkmark icon */}
        <View className="h-16 w-16 items-center justify-center rounded-full bg-green-600">
          <Check size={32} color="#FFFFFF" strokeWidth={3} />
        </View>

        {/* Heading */}
        <Text className="mt-6 text-xl font-semibold text-zinc-900">
          {t('wizard.successHeading')}
        </Text>

        {/* Body */}
        <Text className="mt-2 text-center text-base text-zinc-500">
          {t('wizard.successBody')}
        </Text>

        {/* View PDF link */}
        {contractId && (
          <Text
            className="mt-4 text-base font-semibold text-blue-600"
            onPress={handleViewPdf}
          >
            {t('wizard.viewPdf')}
          </Text>
        )}
      </View>

      {/* Bottom buttons */}
      <View className="px-4 pb-4">
        <AppButton
          title={t('wizard.newRentalBtn')}
          onPress={handleNewRental}
          fullWidth
          className="mb-3"
        />
        <AppButton
          title={t('wizard.backToHome')}
          variant="secondary"
          onPress={handleBackToHome}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}
