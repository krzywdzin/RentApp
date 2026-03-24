import React from 'react';
import { Platform, Pressable, View } from 'react-native';

interface AppCardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
}

const shadowStyle = Platform.select({
  ios: 'shadow-sm',
  android: 'elevation-1',
  default: 'shadow-sm',
});

export function AppCard({ children, className = '', onPress }: AppCardProps) {
  const cardClass = `rounded-xl border border-zinc-200 bg-white p-4 ${shadowStyle} ${className}`;

  if (onPress) {
    return (
      <Pressable className={cardClass} onPress={onPress}>
        {children}
      </Pressable>
    );
  }

  return <View className={cardClass}>{children}</View>;
}
