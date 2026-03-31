import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsOffline } from '@/lib/network';
import { colors, fonts } from '@/lib/theme';

export function OfflineBanner() {
  const isOffline = useIsOffline();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (!isOffline) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 4 }]}>
      <Text style={styles.text}>{t('errors.offline')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.amberGlow + '26',
    paddingHorizontal: 16,
    paddingBottom: 4,
    height: 28,
    justifyContent: 'flex-end',
  },
  text: {
    textAlign: 'center',
    fontFamily: fonts.body,
    fontWeight: '500',
    fontSize: 13,
    color: colors.amberGlow,
  },
});
