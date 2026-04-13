import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  GooglePlacesAutocomplete,
  type GooglePlacesAutocompleteRef,
} from 'react-native-google-places-autocomplete';
import * as SecureStore from 'expo-secure-store';

import { API_URL, SECURE_STORE_KEYS } from '@/lib/constants';
import { colors, fonts, spacing } from '@/lib/theme';

interface PlaceSelection {
  address: string;
  placeId: string;
}

interface PlacesAutocompleteProps {
  label: string;
  value: PlaceSelection | null;
  onSelect: (data: PlaceSelection) => void;
}

export function PlacesAutocomplete({
  label,
  value,
  onSelect,
}: PlacesAutocompleteProps) {
  const ref = useRef<GooglePlacesAutocompleteRef>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN).then(
      (token) => setAccessToken(token),
    );
  }, []);

  // Set the initial text when value is provided (e.g. restoring from draft)
  useEffect(() => {
    if (value?.address && ref.current) {
      ref.current.setAddressText(value.address);
    }
  }, [value?.address]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <GooglePlacesAutocomplete
        ref={ref}
        placeholder="Wpisz adres..."
        onPress={(data) => {
          onSelect({
            address: data.description,
            placeId: data.place_id,
          });
        }}
        query={{
          key: '',
          language: 'pl',
          components: 'country:pl',
          types: 'address',
        }}
        requestUrl={{
          useOnPlatform: 'all',
          url: `${API_URL}/places`,
          headers: {
            Authorization: `Bearer ${accessToken ?? ''}`,
          },
        }}
        debounce={400}
        minLength={3}
        fetchDetails={false}
        enablePoweredByContainer={false}
        keyboardShouldPersistTaps="handled"
        listEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Brak wynikow -- wpisz pelniejszy adres
            </Text>
          </View>
        )}
        textInputProps={{
          placeholderTextColor: colors.warmGray,
          autoCorrect: false,
        }}
        styles={{
          container: styles.autocompleteContainer,
          textInputContainer: styles.textInputContainer,
          textInput: styles.textInput,
          listView: styles.listView,
          row: styles.row,
          separator: styles.separator,
          description: styles.description,
          poweredContainer: { display: 'none' },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
    zIndex: 1,
  },
  label: {
    marginBottom: 4,
    fontFamily: fonts.body,
    fontWeight: '500',
    fontSize: 13,
    color: colors.warmGray,
  },
  autocompleteContainer: {
    flex: 0,
  },
  textInputContainer: {
    backgroundColor: 'transparent',
  },
  textInput: {
    height: 44,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.charcoal,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
    borderRadius: 0,
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  listView: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.sand,
    borderRadius: 8,
    marginTop: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  row: {
    backgroundColor: colors.cream,
    paddingVertical: 12,
    paddingHorizontal: spacing.base,
  },
  separator: {
    height: 1,
    backgroundColor: colors.sand,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.charcoal,
  },
  emptyContainer: {
    padding: spacing.base,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.warmGray,
    fontStyle: 'italic',
  },
});
