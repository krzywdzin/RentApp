import React, { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface AppInputProps extends Omit<TextInputProps, 'className'> {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
  className?: string;
}

export function AppInput({
  label,
  error,
  leftIcon,
  className = '',
  ...rest
}: AppInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const borderClass = error
    ? 'border-red-600'
    : isFocused
      ? 'border-blue-600'
      : 'border-zinc-200';

  return (
    <View className={className}>
      <Text className="mb-1 text-[13px] text-zinc-500">{label}</Text>
      <View
        className={`h-12 flex-row items-center rounded-xl border px-4 ${borderClass}`}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          className="flex-1 text-base text-zinc-900"
          placeholderTextColor="#A1A1AA"
          onFocus={(e) => {
            setIsFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
      </View>
      {error && (
        <Text className="mt-1 text-[13px] text-red-600">{error}</Text>
      )}
    </View>
  );
}
