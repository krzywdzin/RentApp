import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

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
  primary: { backgroundColor: '#3B82F6' },
  secondary: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E4E7' },
  destructive: { backgroundColor: '#DC2626' },
};

const variantText: Record<ButtonVariant, { color: string }> = {
  primary: { color: '#FFFFFF' },
  secondary: { color: '#18181B' },
  destructive: { color: '#FFFFFF' },
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
          color={variant === 'secondary' ? '#71717A' : '#FFFFFF'}
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
    borderRadius: 12,
    paddingHorizontal: 24,
  },
  fullWidth: {
    width: '100%',
  },
  disabledBg: {
    backgroundColor: '#F4F4F5',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: '#A1A1AA',
  },
});
