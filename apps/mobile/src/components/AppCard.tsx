import React from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii } from '@/lib/theme';

interface AppCardProps {
  children: React.ReactNode;
  cardStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const AppCard = React.memo(function AppCard({ children, cardStyle, onPress }: AppCardProps) {
  const combinedStyle = [styles.card, cardStyle];

  if (onPress) {
    return (
      <Pressable style={combinedStyle} onPress={onPress}>
        {children}
      </Pressable>
    );
  }

  return <View style={combinedStyle}>{children}</View>;
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.sand,
    backgroundColor: colors.warmStone,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 1.5,
      },
      android: {
        elevation: 0,
      },
    }),
  },
});
