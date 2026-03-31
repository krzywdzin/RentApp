import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, radii } from '@/lib/theme';

type ButtonVariant = 'primary' | 'secondary' | 'destructive';

interface AppButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  containerStyle?: ViewStyle;
}

const variantBg: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.forestGreen },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.forestGreen },
  destructive: { backgroundColor: colors.terracotta },
};

const variantText: Record<ButtonVariant, { color: string; fontFamily: string }> = {
  primary: { color: colors.cream, fontFamily: fonts.body },
  secondary: { color: colors.forestGreen, fontFamily: fonts.body },
  destructive: { color: colors.cream, fontFamily: fonts.body },
};

export function AppButton({
  title,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  containerStyle,
  ...rest
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={[
        styles.container,
        isDisabled ? styles.disabledBg : variantBg[variant],
        fullWidth ? styles.fullWidth : undefined,
        containerStyle,
      ]}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' ? colors.forestGreen : colors.cream}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            isDisabled ? styles.disabledText : variantText[variant],
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    paddingHorizontal: 24,
  },
  fullWidth: {
    width: '100%',
  },
  disabledBg: {
    backgroundColor: colors.sand,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: colors.warmGray,
  },
});
