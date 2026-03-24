import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useIsOffline } from '@/lib/network';

export function OfflineBanner() {
  const isOffline = useIsOffline();
  const { t } = useTranslation();

  if (!isOffline) return null;

  return (
    <View className="bg-amber-500 px-4 py-2">
      <Text className="text-center text-sm text-white">
        {t('errors.offline')}
      </Text>
    </View>
  );
}
