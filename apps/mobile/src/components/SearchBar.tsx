import React, { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    <View style={styles.container}>
      <Search size={20} color="#A1A1AA" />
      <TextInput
        style={styles.input}
        value={localValue}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor="#A1A1AA"
        returnKeyType="search"
      />
      {localValue.length > 0 && (
        <Pressable onPress={handleClear} hitSlop={8}>
          <X size={20} color="#A1A1AA" />
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
    borderRadius: 12,
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 16,
  },
  input: {
    marginLeft: 8,
    flex: 1,
    fontSize: 16,
    color: '#18181B',
  },
});
