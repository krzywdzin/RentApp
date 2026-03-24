import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

type SkeletonVariant = 'card' | 'list-item' | 'stat' | 'text';

interface LoadingSkeletonProps {
  variant: SkeletonVariant;
  count?: number;
}

const variantStyles: Record<SkeletonVariant, string> = {
  card: 'h-24 w-full rounded-xl bg-zinc-200',
  'list-item': 'h-16 w-full rounded-lg bg-zinc-200',
  stat: 'h-20 w-28 rounded-xl bg-zinc-200',
  text: 'h-4 w-full rounded bg-zinc-200',
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
      className={variantStyles[variant]}
      style={{ opacity }}
    />
  );
}

export function LoadingSkeleton({ variant, count = 1 }: LoadingSkeletonProps) {
  return (
    <View className="gap-3">
      {Array.from({ length: count }, (_, i) => (
        <PulsingBlock key={i} variant={variant} />
      ))}
    </View>
  );
}
