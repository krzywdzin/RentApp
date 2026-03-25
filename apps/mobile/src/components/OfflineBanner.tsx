import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useIsOffline } from '@/lib/network';

export function OfflineBanner() {
  const isOffline = useIsOffline();
  const { t } = useTranslation();

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{t('errors.offline')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    textAlign: 'center',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
