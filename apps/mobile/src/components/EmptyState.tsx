import React from 'react';
import { Text, View } from 'react-native';
import { AppButton } from './AppButton';

interface EmptyStateProps {
  icon?: React.ReactNode;
  heading: string;
  body: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({ icon, heading, body, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      {icon && <View className="mb-4">{icon}</View>}
      <Text className="text-center text-lg font-semibold text-zinc-900">
        {heading}
      </Text>
      <Text className="mt-2 text-center text-base text-zinc-500">{body}</Text>
      {action && (
        <View className="mt-6">
          <AppButton title={action.label} onPress={action.onPress} />
        </View>
      )}
    </View>
  );
}
