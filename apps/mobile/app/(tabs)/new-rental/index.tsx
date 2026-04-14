import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, ScrollView, TouchableOpacity } from 'react-native';
import { CreateCustomerSchema, type CreateCustomerInput } from '@rentapp/shared';
import type { IdCardOcrFields, DriverLicenseOcrFields } from '@rentapp/shared';
import Toast from 'react-native-toast-message';

import { WizardStepper } from '@/components/WizardStepper';
import { SearchBar } from '@/components/SearchBar';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { DocumentScanButton } from '@/components/DocumentScanner/DocumentScanButton';
import { DocumentGuideOverlay } from '@/components/DocumentScanner/DocumentGuideOverlay';
import { DocumentConfirmation } from '@/components/DocumentScanner/DocumentConfirmation';
import { DocumentDiffView } from '@/components/DocumentScanner/DocumentDiffView';
import { useDocumentScan } from '@/hooks/use-document-scan';
import { useRentalDraftStore, useRentalDraftHasHydrated } from '@/stores/rental-draft.store';
import { useCustomerSearch, useCreateCustomer } from '@/hooks/use-customers';
import { RENTAL_WIZARD_LABELS } from '@/lib/constants';
import { colors, fonts, spacing } from '@/lib/theme';

// Field label mapping for diff view
const ID_FIELD_LABELS: Record<string, string> = {
  firstName: 'Imie',
  lastName: 'Nazwisko',
  pesel: 'PESEL',
  documentNumber: 'Nr dowodu',
};

const LICENSE_FIELD_LABELS: Record<string, string> = {
  licenseNumber: 'Nr prawa jazdy',
  categories: 'Kategorie',
  expiryDate: 'Data waznosci',
};

export default function CustomerStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useRentalDraftStore();
  const hydrated = useRentalDraftHasHydrated();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDraftResume, setShowDraftResume] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const { data: customers, isLoading, isFetching } = useCustomerSearch(searchQuery);
  const createCustomer = useCreateCustomer();

  // Document scanning
  const idScan = useDocumentScan('ID_CARD');
  const licenseScan = useDocumentScan('DRIVER_LICENSE');
  const [showRescanConfirm, setShowRescanConfirm] = useState<'ID_CARD' | 'DRIVER_LICENSE' | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateCustomerInput>({
    resolver: zodResolver(CreateCustomerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      pesel: '',
      idNumber: '',
      idIssuedBy: '',
      idExpiryDate: '',
      licenseNumber: '',
      licenseCategory: '',
      licenseIssuedBy: '',
      licenseBookletNumber: '',
      street: '',
      houseNumber: '',
      apartmentNumber: '',
      postalCode: '',
      city: '',
    },
  });

  // Check for existing draft on mount
  useEffect(() => {
    if (draft.customerId) {
      setShowDraftResume(true);
    }
  }, []);

  const handleSelectCustomer = useCallback(
    (id: string, name: string) => {
      draft.updateDraft({ customerId: id, customerName: name, step: 1 });
      router.push('/(tabs)/new-rental/vehicle');
    },
    [draft, router],
  );

  const handleNewCustomer = useCallback(() => {
    setShowNewCustomer(true);
  }, []);

  const handleCreateCustomer = useCallback(
    async (data: CreateCustomerInput) => {
      try {
        const customer = await createCustomer.mutateAsync(data);
        const name = `${customer.firstName} ${customer.lastName}`;
        setShowNewCustomer(false);
        reset();
        handleSelectCustomer(customer.id, name);
      } catch {
        Toast.show({
          type: 'error',
          text1: t('errors.network'),
        });
      }
    },
    [createCustomer, handleSelectCustomer, reset, t],
  );

  const handleDraftResume = useCallback(() => {
    setShowDraftResume(false);
    const stepRoutes: Record<number, string> = {
      1: '/(tabs)/new-rental/vehicle',
      2: '/(tabs)/new-rental/dates',
      3: '/(tabs)/new-rental/contract',
      4: '/(tabs)/new-rental/photos',
      5: '/(tabs)/new-rental/signatures',
    };
    const route = stepRoutes[draft.step];
    if (route) {
      router.push(route as any);
    }
    Toast.show({
      type: 'info',
      text1: t('toasts.draftResumed'),
    });
  }, [draft.step, router, t]);

  const handleDraftReset = useCallback(() => {
    setShowDraftResume(false);
    draft.clearDraft();
  }, [draft]);

  // ---------- Document scan handlers ----------

  const handleIdScanPress = useCallback(() => {
    if (draft.idCardScan) {
      setShowRescanConfirm('ID_CARD');
    } else {
      idScan.startScan();
    }
  }, [draft.idCardScan, idScan]);

  const handleLicenseScanPress = useCallback(() => {
    if (draft.driverLicenseScan) {
      setShowRescanConfirm('DRIVER_LICENSE');
    } else {
      licenseScan.startScan();
    }
  }, [draft.driverLicenseScan, licenseScan]);

  const handleRescanConfirm = useCallback(() => {
    const type = showRescanConfirm;
    setShowRescanConfirm(null);
    if (type === 'ID_CARD') {
      draft.updateDraft({ idCardScan: null });
      idScan.startScan();
    } else if (type === 'DRIVER_LICENSE') {
      draft.updateDraft({ driverLicenseScan: null });
      licenseScan.startScan();
    }
  }, [showRescanConfirm, draft, idScan, licenseScan]);

  const handleIdConfirm = useCallback(
    (fields: Record<string, string>) => {
      // Populate form fields from OCR
      if (fields.firstName) setValue('firstName', fields.firstName);
      if (fields.lastName) setValue('lastName', fields.lastName);
      if (fields.pesel) setValue('pesel', fields.pesel);
      if (fields.documentNumber) setValue('idNumber', fields.documentNumber);
      if (fields.street) setValue('street', fields.street);
      if (fields.houseNumber) setValue('houseNumber', fields.houseNumber);
      if (fields.postalCode) setValue('postalCode', fields.postalCode);
      if (fields.city) setValue('city', fields.city);

      // Store scan in draft
      draft.updateDraft({
        idCardScan: {
          frontUri: idScan.frontUri!,
          backUri: idScan.backUri,
          confirmed: true,
        },
      });
      idScan.reset();
    },
    [setValue, draft, idScan],
  );

  const handleLicenseConfirm = useCallback(
    (fields: Record<string, string>) => {
      if (fields.licenseNumber) setValue('licenseNumber', fields.licenseNumber);
      if (fields.categories) setValue('licenseCategory', fields.categories);

      draft.updateDraft({
        driverLicenseScan: {
          frontUri: licenseScan.frontUri!,
          backUri: licenseScan.backUri,
          confirmed: true,
        },
      });
      licenseScan.reset();
    },
    [setValue, draft, licenseScan],
  );

  const handleIdDiscard = useCallback(() => {
    idScan.reset();
  }, [idScan]);

  const handleLicenseDiscard = useCallback(() => {
    licenseScan.reset();
  }, [licenseScan]);

  // Guide overlay instruction text
  const getGuideInstruction = (
    type: 'ID_CARD' | 'DRIVER_LICENSE',
    phase: string,
  ) => {
    if (type === 'ID_CARD') {
      return phase === 'front_guide' || phase === 'front_captured'
        ? 'Umiesc przod dowodu w ramce'
        : 'Umiesc tyl dowodu w ramce';
    }
    return phase === 'front_guide' || phase === 'front_captured'
      ? 'Umiesc przod prawa jazdy w ramce'
      : 'Umiesc tyl prawa jazdy w ramce';
  };

  const getGuideStep = (phase: string) =>
    phase === 'front_guide' || phase === 'front_captured'
      ? 'Przod (1/2)'
      : 'Tyl (2/2)';

  // snapPoints removed - using Modal instead of BottomSheet

  // Wait for persisted store to hydrate before rendering
  if (!hydrated) return null;

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <WizardStepper
        currentStep={1}
        totalSteps={6}
        labels={RENTAL_WIZARD_LABELS}
      />

      <Text style={s.stepTitle}>
        {t('wizard.step1')}
      </Text>

      <View style={s.mt16}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('wizard.customerSearch')}
        />
      </View>

      {searchQuery.length < 2 && (
        <Text style={s.searchHint}>Wpisz minimum 2 znaki aby wyszukac</Text>
      )}
      {isFetching && searchQuery.length >= 2 && (
        <View style={s.spinnerRow}>
          <ActivityIndicator size="small" color={colors.forestGreen} />
          <Text style={s.spinnerText}>Szukanie...</Text>
        </View>
      )}

      <FlatList
        style={s.list}
        contentContainerStyle={s.listContent}
        data={customers ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AppCard
            cardStyle={s.mb12}
            onPress={() =>
              handleSelectCustomer(
                item.id,
                `${item.firstName} ${item.lastName}`,
              )
            }
          >
            <Text style={s.custName}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={s.custSub}>{item.phone}</Text>
            {item.email && (
              <Text style={s.custSub}>{item.email}</Text>
            )}
          </AppCard>
        )}
        ListEmptyComponent={
          searchQuery.length >= 2 && !isLoading ? (
            <EmptyState
              heading={t('empty.noCustomer')}
              body={t('empty.noCustomerBody')}
            />
          ) : null
        }
        ListFooterComponent={
          <View style={s.mt8}>
            <AppButton
              title={t('wizard.newCustomer')}
              variant="secondary"
              onPress={handleNewCustomer}
              fullWidth
            />
          </View>
        }
      />

      <Modal
        visible={showNewCustomer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewCustomer(false)}
      >
        <View style={s.modalRoot}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Nowy klient</Text>
            <TouchableOpacity onPress={() => setShowNewCustomer(false)}>
              <Text style={s.modalClose}>Zamknij</Text>
            </TouchableOpacity>
          </View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex1}>
          <ScrollView
            contentContainerStyle={s.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
          <Text style={s.modalHeading}>
            {t('wizard.newCustomer')}
          </Text>

          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Imie"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.firstName?.message}
                containerStyle={s.mb12}
              />
            )}
          />

          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Nazwisko"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.lastName?.message}
                containerStyle={s.mb12}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Telefon"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="phone-pad"
                error={errors.phone?.message}
                containerStyle={s.mb12}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Email"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
                containerStyle={s.mb12}
              />
            )}
          />

          <Controller
            control={control}
            name="pesel"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="PESEL"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="numeric"
                maxLength={11}
                error={errors.pesel?.message}
                containerStyle={s.mb12}
              />
            )}
          />

          <Controller
            control={control}
            name="idNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Numer dowodu"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="characters"
                error={errors.idNumber?.message}
                containerStyle={s.mb12}
              />
            )}
          />

          <Controller
            control={control}
            name="idIssuedBy"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Organ wydający dowód"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="np. Prezydent m.st. Warszawy"
                error={(errors as Record<string, {message?: string}>).idIssuedBy?.message}
                containerStyle={s.mb12}
              />
            )}
          />

          <Controller
            control={control}
            name="idExpiryDate"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Data ważności dowodu"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="RRRR-MM-DD"
                error={(errors as Record<string, {message?: string}>).idExpiryDate?.message}
                containerStyle={s.mb12}
              />
            )}
          />

          {/* Document scan buttons */}
          <Text style={s.sectionHeading}>Skanowanie dokumentow</Text>

          <View style={s.scanButtonsContainer}>
            <DocumentScanButton
              documentType="ID_CARD"
              label="Skanuj dowod osobisty"
              scanData={draft.idCardScan}
              onPress={handleIdScanPress}
            />
            <DocumentScanButton
              documentType="DRIVER_LICENSE"
              label="Skanuj prawo jazdy"
              scanData={draft.driverLicenseScan}
              onPress={handleLicenseScanPress}
            />
          </View>

          <Controller
            control={control}
            name="licenseNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Numer prawa jazdy"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="characters"
                error={errors.licenseNumber?.message}
                containerStyle={s.mb12}
              />
            )}
          />

          <Controller
            control={control}
            name="licenseCategory"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Kategoria prawa jazdy"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="np. B, B+E, C"
                autoCapitalize="characters"
                error={(errors as Record<string, {message?: string}>).licenseCategory?.message}
                containerStyle={s.mb12}
              />
            )}
          />

          <Controller
            control={control}
            name="licenseIssuedBy"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Organ wydający prawo jazdy"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="np. Starosta bydgoski"
                error={(errors as Record<string, {message?: string}>).licenseIssuedBy?.message}
                containerStyle={s.mb12}
              />
            )}
          />

          <Controller
            control={control}
            name="licenseBookletNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Nr blankietu prawa jazdy"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="np. MC 1234567"
                autoCapitalize="characters"
                error={(errors as Record<string, {message?: string}>).licenseBookletNumber?.message}
                containerStyle={s.mb12}
              />
            )}
          />

          {/* Address section */}
          <Text style={s.sectionHeading}>Adres klienta</Text>

          <Controller
            control={control}
            name="street"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Ulica"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={(errors as Record<string, {message?: string}>).street?.message}
                containerStyle={s.mb12}
              />
            )}
          />

          <View style={s.fieldRow}>
            <Controller
              control={control}
              name="houseNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Numer domu"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={(errors as Record<string, {message?: string}>).houseNumber?.message}
                  containerStyle={s.fieldHalf}
                />
              )}
            />
            <Controller
              control={control}
              name="apartmentNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Numer mieszkania"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={(errors as Record<string, {message?: string}>).apartmentNumber?.message}
                  containerStyle={s.fieldHalf}
                />
              )}
            />
          </View>

          <View style={s.fieldRowPostal}>
            <Controller
              control={control}
              name="postalCode"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Kod pocztowy"
                  value={value ?? ''}
                  onChangeText={(text: string) => {
                    // Auto-insert dash after 2 digits
                    const digits = text.replace(/[^0-9]/g, '');
                    if (digits.length <= 2) {
                      onChange(digits);
                    } else {
                      onChange(`${digits.slice(0, 2)}-${digits.slice(2, 5)}`);
                    }
                  }}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholder="XX-XXX"
                  error={(errors as Record<string, {message?: string}>).postalCode?.message}
                  containerStyle={s.fieldPostal}
                />
              )}
            />
            <Controller
              control={control}
              name="city"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Miasto"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={(errors as Record<string, {message?: string}>).city?.message}
                  containerStyle={s.fieldCity}
                />
              )}
            />
          </View>

          <AppButton
            title="🔍 Sprawdź uprawnienia kierowcy (gov.pl)"
            onPress={() => Linking.openURL('https://moj.gov.pl/uslugi/engine/ng/index?xFormsAppName=UprawnieniaKierowcow&xFormsOrigin=EXTERNAL')}
            variant="secondary"
            fullWidth
            containerStyle={s.mb12}
          />

          <AppButton
            title={t('common.save')}
            onPress={handleSubmit(handleCreateCustomer)}
            loading={createCustomer.isPending}
            fullWidth
            containerStyle={s.mt8}
          />
          </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <ConfirmationDialog
        visible={showDraftResume}
        title={t('wizard.draftResumeTitle')}
        body={t('wizard.draftResumeBody')}
        confirmLabel={t('wizard.draftResumeContinue')}
        cancelLabel={t('wizard.draftResumeReset')}
        onConfirm={handleDraftResume}
        onCancel={handleDraftReset}
      />

      {/* Re-scan confirmation dialog */}
      <ConfirmationDialog
        visible={showRescanConfirm !== null}
        title="Skanuj ponownie?"
        body="Poprzednie zdjecia i dane ze skanu zostana zastapione."
        confirmLabel="Skanuj ponownie"
        cancelLabel="Nie, zachowaj"
        onConfirm={handleRescanConfirm}
        onCancel={() => setShowRescanConfirm(null)}
      />

      {/* ID card guide overlay */}
      <DocumentGuideOverlay
        visible={idScan.phase === 'front_guide' || idScan.phase === 'back_guide'}
        instruction={getGuideInstruction('ID_CARD', idScan.phase)}
        step={getGuideStep(idScan.phase)}
        onCapture={idScan.capturePhoto}
        onClose={idScan.reset}
      />

      {/* Driver license guide overlay */}
      <DocumentGuideOverlay
        visible={licenseScan.phase === 'front_guide' || licenseScan.phase === 'back_guide'}
        instruction={getGuideInstruction('DRIVER_LICENSE', licenseScan.phase)}
        step={getGuideStep(licenseScan.phase)}
        onCapture={licenseScan.capturePhoto}
        onClose={licenseScan.reset}
      />

      {/* ID card confirmation */}
      {idScan.phase === 'review' && idScan.ocrResult && idScan.frontUri && (
        <DocumentConfirmation
          visible
          documentType="ID_CARD"
          frontUri={idScan.frontUri}
          ocrFields={idScan.ocrResult as IdCardOcrFields}
          onConfirm={handleIdConfirm}
          onDiscard={handleIdDiscard}
        />
      )}

      {/* Driver license confirmation */}
      {licenseScan.phase === 'review' && licenseScan.ocrResult && licenseScan.frontUri && (
        <DocumentConfirmation
          visible
          documentType="DRIVER_LICENSE"
          frontUri={licenseScan.frontUri}
          ocrFields={licenseScan.ocrResult as DriverLicenseOcrFields}
          onConfirm={handleLicenseConfirm}
          onDiscard={handleLicenseDiscard}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  stepTitle: { marginTop: spacing.base, paddingHorizontal: spacing.base, fontFamily: fonts.display, fontSize: 20, fontWeight: '600', color: colors.charcoal },
  mt16: { marginTop: spacing.base },
  mt8: { marginTop: spacing.sm },
  mb12: { marginBottom: spacing.md },
  list: { marginTop: spacing.base, flex: 1 },
  listContent: { paddingHorizontal: spacing.base, paddingBottom: 100 },
  custName: { fontFamily: fonts.body, fontSize: 16, fontWeight: '500', color: colors.charcoal },
  custSub: { marginTop: 4, fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  flex1: { flex: 1 },
  modalRoot: { flex: 1, backgroundColor: colors.cream },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.sand },
  modalTitle: { fontFamily: fonts.display, fontSize: 18, fontWeight: '600', color: colors.charcoal },
  modalClose: { fontFamily: fonts.body, color: colors.forestGreen, fontSize: 16 },
  modalScroll: { padding: spacing.base, paddingBottom: 40 },
  modalHeading: { marginBottom: spacing.base, fontFamily: fonts.display, fontSize: 20, fontWeight: '600', color: colors.charcoal },
  searchHint: { paddingHorizontal: spacing.base, marginTop: spacing.sm, fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  spinnerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, marginTop: spacing.sm, gap: 8 },
  spinnerText: { fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  sectionHeading: { marginTop: spacing.lg, marginBottom: spacing.base, fontFamily: fonts.display, fontSize: 20, fontWeight: '600', color: colors.charcoal },
  fieldRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  fieldHalf: { flex: 1 },
  fieldRowPostal: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  fieldPostal: { flex: 2 },
  fieldCity: { flex: 3 },
  scanButtonsContainer: { gap: spacing.md, marginBottom: spacing.lg },
});
