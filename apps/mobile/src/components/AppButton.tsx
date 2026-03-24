import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'destructive';

interface AppButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600',
  secondary: 'border border-zinc-200 bg-white',
  destructive: 'bg-red-600',
};

const variantTextStyles: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-zinc-900',
  destructive: 'text-white',
};

export function AppButton({
  title,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  ...rest
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  const containerClass = [
    'min-h-[48px] items-center justify-center rounded-xl px-6',
    isDisabled ? 'bg-zinc-100' : variantStyles[variant],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const textClass = [
    'text-base font-semibold',
    isDisabled ? 'text-zinc-400' : variantTextStyles[variant],
  ].join(' ');

  return (
    <Pressable
      className={containerClass}
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
        <Text className={textClass}>{title}</Text>
      )}
    </Pressable>
  );
}
