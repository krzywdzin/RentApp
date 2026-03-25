import React from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
});
