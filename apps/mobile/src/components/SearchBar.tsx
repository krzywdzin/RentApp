import React, { useCallback, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
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
    <View className="mx-4 h-12 flex-row items-center rounded-xl bg-zinc-100 px-4">
      <Search size={20} color="#A1A1AA" />
      <TextInput
        className="ml-2 flex-1 text-base text-zinc-900"
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
