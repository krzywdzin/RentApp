import React from 'react';
import { StyleSheet, Text, View, type ViewStyle, type TextStyle } from 'react-native';

interface StatusBadgeProps {
  status: string;
}

interface BadgeStyle {
  bg: string;
  fg: string;
  label: string;
}

const STATUS_MAP: Record<string, BadgeStyle> = {
  ACTIVE: { bg: '#DCFCE7', fg: '#15803D', label: 'Aktywny' },
  RENTED: { bg: '#DCFCE7', fg: '#15803D', label: 'Aktywny' },
  DRAFT: { bg: '#F4F4F5', fg: '#52525B', label: 'Wersja robocza' },
  EXTENDED: { bg: '#FEF3C7', fg: '#B45309', label: 'Przedluzony' },
  RETURNED: { bg: '#E4E4E7', fg: '#52525B', label: 'Zwrócony' },
  OVERDUE: { bg: '#FEE2E2', fg: '#B91C1C', label: 'Przeterminowany' },
};

const DEFAULT_STYLE: BadgeStyle = { bg: '#F4F4F5', fg: '#52525B', label: '' };

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
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
});
