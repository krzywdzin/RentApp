import React from 'react';
import { Text, View } from 'react-native';

interface StatusBadgeProps {
  status: string;
}

interface BadgeStyle {
  container: string;
  text: string;
  label: string;
}

const STATUS_MAP: Record<string, BadgeStyle> = {
  ACTIVE: {
    container: 'bg-green-100',
    text: 'text-green-700',
    label: 'Aktywny',
  },
  RENTED: {
    container: 'bg-green-100',
    text: 'text-green-700',
    label: 'Aktywny',
  },
  DRAFT: {
    container: 'bg-zinc-100',
    text: 'text-zinc-600',
    label: 'Szkic',
  },
  EXTENDED: {
    container: 'bg-amber-100',
    text: 'text-amber-700',
    label: 'Przedluzony',
  },
  RETURNED: {
    container: 'bg-zinc-200',
    text: 'text-zinc-600',
    label: 'Zwrocony',
  },
  OVERDUE: {
    container: 'bg-red-100',
    text: 'text-red-700',
    label: 'Przeterminowany',
  },
};

const DEFAULT_STYLE: BadgeStyle = {
  container: 'bg-zinc-100',
  text: 'text-zinc-600',
  label: '',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_MAP[status] ?? DEFAULT_STYLE;
  const label = style.label || status;

  return (
    <View className={`rounded-full px-3 py-1 ${style.container}`}>
      <Text className={`text-[13px] font-medium ${style.text}`}>{label}</Text>
    </View>
  );
}
