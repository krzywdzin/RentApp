import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/stores/auth.store';
import { formatDate } from '@/lib/format';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const firstName = user?.name?.split(' ')[0] ?? '';
  const today = formatDate(new Date());

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-1 px-4 pt-4">
        {/* Greeting */}
        <Text className="text-[20px] font-semibold text-zinc-900">
          {t('dashboard.greeting', { firstName })}
        </Text>
        <Text className="mt-1 text-base text-zinc-500">{today}</Text>

        {/* Placeholder */}
        <View className="mt-8 flex-1 items-center justify-center">
          <Text className="text-base text-zinc-400">
            Dashboard coming in Plan 03
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
