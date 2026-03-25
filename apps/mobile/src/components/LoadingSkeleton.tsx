import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

type SkeletonVariant = 'card' | 'list-item' | 'stat' | 'text';

interface LoadingSkeletonProps {
  variant: SkeletonVariant;
  count?: number;
}

const variantStyles: Record<SkeletonVariant, ViewStyle> = {
  card: { height: 96, width: '100%', borderRadius: 12, backgroundColor: '#E4E4E7' },
  'list-item': { height: 64, width: '100%', borderRadius: 8, backgroundColor: '#E4E4E7' },
  stat: { height: 80, width: 112, borderRadius: 12, backgroundColor: '#E4E4E7' },
  text: { height: 16, width: '100%', borderRadius: 4, backgroundColor: '#E4E4E7' },
};

function PulsingBlock({ variant }: { variant: SkeletonVariant }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[variantStyles[variant], { opacity }]}
    />
  );
}

export function LoadingSkeleton({ variant, count = 1 }: LoadingSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, i) => (
        <PulsingBlock key={i} variant={variant} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});
