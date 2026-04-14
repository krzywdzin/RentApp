import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { ScanPhase } from '@/lib/ocr/ocr-types';
import { colors, fonts, spacing } from '@/lib/theme';

interface ScanProgressIndicatorProps {
  phase: ScanPhase;
}

export function ScanProgressIndicator({ phase }: ScanProgressIndicatorProps) {
  const frontActive =
    phase === 'front_guide' || phase === 'front_captured';
  const backActive =
    phase === 'back_guide' || phase === 'back_captured';
  const isProcessing = phase === 'processing';

  return (
    <View style={s.container}>
      <View style={s.dotsRow}>
        <View style={s.dotGroup}>
          <View
            style={[
              s.dot,
              (frontActive || backActive || isProcessing) && s.dotActive,
            ]}
          />
          <Text style={s.dotLabel}>Przod</Text>
        </View>
        <View style={s.connector} />
        <View style={s.dotGroup}>
          <View
            style={[s.dot, (backActive || isProcessing) && s.dotActive]}
          />
          <Text style={s.dotLabel}>Tyl</Text>
        </View>
      </View>

      {isProcessing && (
        <View style={s.processingRow}>
          <ActivityIndicator size="small" color={colors.forestGreen} />
          <Text style={s.processingText}>Odczytywanie danych...</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dotGroup: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.warmStone,
  },
  dotActive: {
    backgroundColor: colors.forestGreen,
  },
  connector: {
    width: 24,
    height: 2,
    backgroundColor: colors.warmStone,
  },
  dotLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.warmGray,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  processingText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.warmGray,
  },
});
