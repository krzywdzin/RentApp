import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/lib/theme';

interface StatusBadgeProps {
  status: string;
}

interface BadgeStyle {
  bg: string;
  fg: string;
  label: string;
}

const STATUS_MAP: Record<string, BadgeStyle> = {
  ACTIVE: { bg: colors.sage + '14', fg: colors.sage, label: 'Aktywny' },
  RENTED: { bg: colors.sage + '14', fg: colors.sage, label: 'Aktywny' },
  DRAFT: { bg: colors.warmGray + '14', fg: colors.warmGray, label: 'Szkic' },
  EXTENDED: { bg: colors.amberGlow + '14', fg: colors.amberGlow, label: 'Przedłużony' },
  RETURNED: { bg: colors.warmGray + '14', fg: colors.warmGray, label: 'Zwrócony' },
  OVERDUE: { bg: colors.terracotta + '14', fg: colors.terracotta, label: 'Zaległy' },
};

const DEFAULT_STYLE: BadgeStyle = { bg: colors.warmGray + '14', fg: colors.warmGray, label: '' };

export function StatusBadge({ status }: StatusBadgeProps) {
  const badgeStyle = STATUS_MAP[status] ?? DEFAULT_STYLE;
  const label = badgeStyle.label || status;

  return (
    <View style={[styles.container, { backgroundColor: badgeStyle.bg }]}>
      <Text style={[styles.text, { color: badgeStyle.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  text: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
