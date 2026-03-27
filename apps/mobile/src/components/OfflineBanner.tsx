import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsOffline } from '@/lib/network';

export function OfflineBanner() {
  const isOffline = useIsOffline();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (!isOffline) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.text}>{t('errors.offline')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  text: {
    textAlign: 'center',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
