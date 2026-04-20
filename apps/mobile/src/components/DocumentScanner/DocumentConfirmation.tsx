import React from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import type { DocumentType, IdCardOcrFields, DriverLicenseOcrFields } from '@rentapp/shared';
import { AppInput } from '@/components/AppInput';
import { AppButton } from '@/components/AppButton';
import { colors, fonts, spacing } from '@/lib/theme';

interface DocumentConfirmationProps {
  visible: boolean;
  documentType: DocumentType;
  frontUri: string;
  ocrFields: IdCardOcrFields | DriverLicenseOcrFields;
  onConfirm: (fields: Record<string, string>) => void;
  onDiscard: () => void;
}

const ID_FIELD_KEYS: Array<{ key: keyof IdCardOcrFields; label: string; placeholder?: string }> = [
  { key: 'firstName', label: 'Imie' },
  { key: 'lastName', label: 'Nazwisko' },
  { key: 'pesel', label: 'PESEL' },
  { key: 'documentNumber', label: 'Nr dowodu' },
  { key: 'issuedBy', label: 'Organ wydajacy', placeholder: 'np. Prezydent m.st. Warszawy' },
  { key: 'expiryDate', label: 'Data waznosci dowodu', placeholder: 'RRRR-MM-DD' },
];

const LICENSE_FIELD_KEYS: Array<{
  key: keyof DriverLicenseOcrFields;
  label: string;
  placeholder?: string;
}> = [
  { key: 'licenseNumber', label: 'Nr prawa jazdy' },
  { key: 'categories', label: 'Kategorie' },
  { key: 'expiryDate', label: 'Data waznosci', placeholder: 'RRRR-MM-DD' },
  { key: 'bookletNumber', label: 'Nr blankietu', placeholder: 'np. MC 1234567' },
  { key: 'issuedBy', label: 'Organ wydajacy', placeholder: 'np. Starosta Torunski' },
];

const ADDRESS_FIELDS = [
  { key: 'street', label: 'Ulica' },
  { key: 'houseNumber', label: 'Numer domu' },
  { key: 'postalCode', label: 'Kod pocztowy' },
  { key: 'city', label: 'Miasto' },
];

export function DocumentConfirmation({
  visible,
  documentType,
  frontUri,
  ocrFields,
  onConfirm,
  onDiscard,
}: DocumentConfirmationProps) {
  const insets = useSafeAreaInsets();

  const fieldKeys = documentType === 'ID_CARD' ? ID_FIELD_KEYS : LICENSE_FIELD_KEYS;

  // Build default values from OCR fields
  const defaultValues: Record<string, string> = {};
  for (const { key } of fieldKeys) {
    defaultValues[key] = (ocrFields as unknown as Record<string, string | null>)[key] ?? '';
  }
  if (documentType === 'ID_CARD') {
    for (const { key } of ADDRESS_FIELDS) {
      defaultValues[key] = '';
    }
  }

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues,
  });

  const handleConfirm = handleSubmit((data) => {
    onConfirm(data);
  });

  const title = documentType === 'ID_CARD' ? 'Dane z dowodu osobistego' : 'Dane z prawa jazdy';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDiscard}
    >
      <View style={[s.root, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Document thumbnail */}
          <View style={s.thumbContainer}>
            <Image source={{ uri: frontUri }} style={s.thumbnail} />
          </View>

          {/* Section heading */}
          <Text style={s.sectionTitle}>{title}</Text>

          {/* OCR fields */}
          {fieldKeys.map(({ key, label, placeholder }) => {
            const value = (ocrFields as unknown as Record<string, string | null>)[key];
            const extracted = value != null;

            return (
              <Controller
                key={key}
                control={control}
                name={key}
                rules={
                  documentType === 'ID_CARD' && (key === 'firstName' || key === 'lastName')
                    ? { required: `${label} jest wymagane` }
                    : undefined
                }
                render={({ field: { onChange, onBlur, value: fieldValue } }) => (
                  <View style={s.fieldWrapper}>
                    <AppInput
                      label={label}
                      value={fieldValue}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder={placeholder}
                      error={(errors as Record<string, { message?: string }>)[key]?.message}
                      containerStyle={{
                        marginBottom: spacing.md,
                        backgroundColor: extracted ? colors.sageTint : colors.terracottaTint,
                        borderRadius: 8,
                        padding: 4,
                      }}
                    />
                    {!extracted && <Text style={s.fieldHint}>Nie odczytano -- wpisz recznie</Text>}
                  </View>
                )}
              />
            );
          })}

          {/* Address section for ID card */}
          {documentType === 'ID_CARD' && (
            <>
              <Text style={s.addressHeading}>Adres -- wpisz recznie</Text>
              <Text style={s.addressHelper}>
                Nowy dowod nie zawiera adresu. Wpisz dane recznie.
              </Text>

              {ADDRESS_FIELDS.map(({ key, label }) => (
                <Controller
                  key={key}
                  control={control}
                  name={key}
                  render={({ field: { onChange, onBlur, value: fieldValue } }) => (
                    <AppInput
                      label={label}
                      value={fieldValue}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      containerStyle={{
                        marginBottom: spacing.md,
                        backgroundColor: colors.terracottaTint,
                        borderRadius: 8,
                        padding: 4,
                      }}
                    />
                  )}
                />
              ))}
            </>
          )}
        </ScrollView>

        {/* Bottom action bar */}
        <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <AppButton title="Zatwierdz" onPress={handleConfirm} fullWidth />
          <Pressable style={s.discardButton} onPress={onDiscard}>
            <Text style={s.discardText}>Odrzuc skan</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: 120,
  },
  thumbContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  thumbnail: {
    height: 120,
    width: 190,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warmStone,
    resizeMode: 'cover',
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing.base,
  },
  mb12: {
    marginBottom: spacing.md,
  },
  fieldWrapper: {
    marginBottom: spacing.md,
  },
  fieldHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.terracotta,
    marginTop: -8,
    marginBottom: 4,
  },
  addressHeading: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: '600',
    color: colors.charcoal,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  addressHelper: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.warmGray,
    marginBottom: spacing.base,
    lineHeight: 18,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: colors.sand,
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  discardButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  discardText: {
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: '400',
    color: colors.terracotta,
    textAlign: 'center',
  },
});
