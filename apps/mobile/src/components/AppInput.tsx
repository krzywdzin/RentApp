import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

interface AppInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function AppInput({
  label,
  error,
  leftIcon,
  containerStyle,
  onFocus,
  onBlur,
  ...rest
}: AppInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const inputId = label.toLowerCase().replace(/\s+/g, '-') + '-input';

  const borderColor = error
    ? '#DC2626'
    : isFocused
      ? '#3B82F6'
      : '#E4E4E7';

  return (
    <View style={containerStyle}>
      <Text style={styles.label} nativeID={inputId + '-label'}>{label}</Text>
      <View style={[styles.inputRow, { borderColor }]}>
        {leftIcon && <View style={styles.iconWrap}>{leftIcon}</View>}
        <TextInput
          style={styles.input}
          placeholderTextColor="#A1A1AA"
          accessibilityLabel={label}
          accessibilityLabelledBy={inputId + '-label'}
          {...(error ? { accessibilityHint: error } : {})}
          {...rest}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 4,
    fontSize: 13,
    color: '#71717A',
  },
  inputRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  iconWrap: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#18181B',
  },
  error: {
    marginTop: 4,
    fontSize: 13,
    color: '#DC2626',
  },
});
