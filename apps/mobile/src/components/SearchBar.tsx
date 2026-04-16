import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors, fonts, radii } from '@/lib/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
}

export function SearchBar({ value, onChangeText, placeholder, accessibilityLabel }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when parent value prop changes externally (e.g., reset to '')
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleChange = useCallback(
    (text: string) => {
      setLocalValue(text);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        onChangeText(text);
      }, 300);
    },
    [onChangeText],
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    onChangeText('');
  }, [onChangeText]);

  return (
    <View style={styles.container} accessibilityRole="search">
      <Search size={20} color={colors.warmGray} />
      <TextInput
        style={styles.input}
        value={localValue}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.warmGray}
        returnKeyType="search"
        accessibilityLabel={accessibilityLabel ?? placeholder ?? 'Szukaj'}
      />
      {localValue.length > 0 && (
        <Pressable onPress={handleClear} hitSlop={8} accessibilityLabel="Wyczysc wyszukiwanie">
          <X size={20} color={colors.warmGray} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.sand,
    backgroundColor: colors.cream,
    paddingHorizontal: 16,
  },
  input: {
    marginLeft: 8,
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.charcoal,
  },
});
