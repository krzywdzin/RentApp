import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Pressable, ScrollView, TouchableOpacity } from 'react-native';
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
import { BackScanPrompt } from '@/components/DocumentScanner/BackScanPrompt';
import { DocumentConfirmation } from '@/components/DocumentScanner/DocumentConfirmation';
import { DocumentDiffView } from '@/components/DocumentScanner/DocumentDiffView';
import { AppSwitch } from '@/components/AppSwitch';
import { useDocumentScan } from '@/hooks/use-document-scan';
import { useRentalDraftStore, useRentalDraftHasHydrated } from '@/stores/rental-draft.store';
import { useCustomerSearch, useCreateCustomer, useCustomer } from '@/hooks/use-customers';
import { RENTAL_WIZARD_LABELS } from '@/lib/constants';
import { colors, fonts, spacing } from '@/lib/theme';

// Field label mapping for diff view
const ID_FIELD_LABELS: Record<string, string> = {
  firstName: 'Imie',
  lastName: 'Nazwisko',
  pesel: 'PESEL',
  documentNumber: 'Nr dowodu',
  issuedBy: 'Organ wydajacy',
  expiryDate: 'Data waznosci',
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

  const [isCompanyRental, setIsCompanyRental] = useState(draft.isCompanyRental ?? false);
  const [companyNip, setCompanyNip] = useState(draft.companyNip ?? '');
  const [vatPayerStatus, setVatPayerStatus] = useState<'FULL_100' | 'HALF_50' | 'NONE' | null>(
    (draft.vatPayerStatus as 'FULL_100' | 'HALF_50' | 'NONE' | null) ?? null,
  );

  const VAT_OPTIONS = [
    { label: '100%', value: 'FULL_100' as const },
    { label: '50%', value: 'HALF_50' as const },
    { label: 'Nie', value: 'NONE' as const },
  ];

  // Document scanning
  const idScan = useDocumentScan('ID_CARD');
  const licenseScan = useDocumentScan('DRIVER_LICENSE');
  const [showRescanConfirm, setShowRescanConfirm] = useState<'ID_CARD' | 'DRIVER_LICENSE' | null>(
    null,
  );
  const [pendingExistingCustomer, setPendingExistingCustomer] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showIdDiff, setShowIdDiff] = useState(false);
  const [showLicenseDiff, setShowLicenseDiff] = useState(false);

  // Fetch full data for selected existing customer (for diff view)
  const { data: existingCustomerData } = useCustomer(pendingExistingCustomer?.id ?? '');

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

  // Check for existing draft after hydration, but never interrupt active create/select flow.
  useEffect(() => {
    if (!hydrated) return;

    const isBusyInCustomerStep = showNewCustomer || pendingExistingCustomer !== null;
    if (isBusyInCustomerStep) {
      setShowDraftResume(false);
      return;
    }

    if (draft.customerId) {
      setShowDraftResume(true);
    }
  }, [hydrated, draft.customerId, showNewCustomer, pendingExistingCustomer]);

  const handleSelectCustomer = useCallback(
    (id: string, name: string) => {
      setShowDraftResume(false);
      draft.updateDraft({
        customerId: id,
        customerName: name,
        step: 1,
        isCompanyRental,
        companyNip: isCompanyRental ? companyNip || null : null,
        vatPayerStatus: isCompanyRental ? vatPayerStatus || null : null,
      });
      router.push('/(tabs)/new-rental/vehicle');
    },
    [draft, router, isCompanyRental, companyNip, vatPayerStatus],
  );

  const handleNewCustomer = useCallback(() => {
    setShowNewCustomer(true);
  }, []);

  // NOTE: We intentionally do NOT upload document photos to the backend.
  // OCR should only prefill fields for the worker; raw ID/license photos must stay off the server (RODO).

  const handleCreateCustomer = useCallback(
    async (data: CreateCustomerInput) => {
      try {
        const customer = await createCustomer.mutateAsync(data);
        const name = `${customer.firstName} ${customer.lastName}`;
        setShowDraftResume(false);
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
      if (fields.issuedBy) setValue('idIssuedBy', fields.issuedBy);
      if (fields.expiryDate) setValue('idExpiryDate', fields.expiryDate);
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
      if (fields.bookletNumber) setValue('licenseBookletNumber', fields.bookletNumber);
      if (fields.issuedBy) setValue('licenseIssuedBy', fields.issuedBy);

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

  // ---------- Existing customer diff view handlers ----------

  const handleProceedWithExisting = useCallback(() => {
    if (!pendingExistingCustomer) return;
    handleSelectCustomer(pendingExistingCustomer.id, pendingExistingCustomer.name);
    setPendingExistingCustomer(null);
  }, [pendingExistingCustomer, handleSelectCustomer]);

  // Show diff views when OCR scan completes for existing customer
  useEffect(() => {
    if (pendingExistingCustomer && idScan.phase === 'review' && idScan.ocrResult) {
      setShowIdDiff(true);
    }
  }, [pendingExistingCustomer, idScan.phase, idScan.ocrResult]);

  useEffect(() => {
    if (pendingExistingCustomer && licenseScan.phase === 'review' && licenseScan.ocrResult) {
      setShowLicenseDiff(true);
    }
  }, [pendingExistingCustomer, licenseScan.phase, licenseScan.ocrResult]);

  const handleIdDiffUpdate = useCallback(
    (selectedFields: Record<string, string>) => {
      draft.updateDraft({
        idCardScan: {
          frontUri: idScan.frontUri!,
          backUri: idScan.backUri,
          confirmed: true,
        },
      });
      setShowIdDiff(false);
      idScan.reset();
    },
    [draft, idScan],
  );

  const handleIdDiffKeep = useCallback(() => {
    setShowIdDiff(false);
    idScan.reset();
  }, [idScan]);

  const handleLicenseDiffUpdate = useCallback(
    (selectedFields: Record<string, string>) => {
      draft.updateDraft({
        driverLicenseScan: {
          frontUri: licenseScan.frontUri!,
          backUri: licenseScan.backUri,
          confirmed: true,
        },
      });
      setShowLicenseDiff(false);
      licenseScan.reset();
    },
    [draft, licenseScan],
  );

  const handleLicenseDiffKeep = useCallback(() => {
    setShowLicenseDiff(false);
    licenseScan.reset();
  }, [licenseScan]);

  // Build current fields from existing customer data for diff comparison
  const existingIdFields = useMemo((): Record<string, string | null> => {
    if (!existingCustomerData)
      return { firstName: null, lastName: null, pesel: null, documentNumber: null };
    return {
      firstName: existingCustomerData.firstName ?? null,
      lastName: existingCustomerData.lastName ?? null,
      pesel: existingCustomerData.pesel ?? null,
      documentNumber: existingCustomerData.idNumber ?? null,
    };
  }, [existingCustomerData]);

  const existingLicenseFields = useMemo((): Record<string, string | null> => {
    if (!existingCustomerData)
      return {
        licenseNumber: null,
        categories: null,
        expiryDate: null,
        bookletNumber: null,
        issuedBy: null,
      };
    return {
      licenseNumber: existingCustomerData.licenseNumber ?? null,
      categories: existingCustomerData.licenseCategory ?? null,
      expiryDate: null,
      bookletNumber: existingCustomerData.licenseBookletNumber ?? null,
      issuedBy: existingCustomerData.licenseIssuedBy ?? null,
    };
  }, [existingCustomerData]);

  // Guide overlay instruction text
  const getGuideInstruction = (type: 'ID_CARD' | 'DRIVER_LICENSE') => {
    return type === 'ID_CARD' ? 'Umiesc przod dowodu w ramce' : 'Umiesc przod prawa jazdy w ramce';
  };

  // snapPoints removed - using Modal instead of BottomSheet

  // Wait for persisted store to hydrate before rendering
  if (!hydrated) return null;

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <WizardStepper currentStep={1} totalSteps={6} labels={RENTAL_WIZARD_LABELS} />

      <Text style={s.stepTitle}>{t('wizard.step1')}</Text>

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

      {pendingExistingCustomer && !showNewCustomer ? (
        <ScrollView style={s.list} contentContainerStyle={s.listContent}>
          <AppCard cardStyle={s.mb12}>
            <View style={s.existingCustomerHeader}>
              <Text style={s.custName}>{pendingExistingCustomer.name}</Text>
              <TouchableOpacity onPress={() => setPendingExistingCustomer(null)}>
                <Text style={s.changeButton}>Zmien</Text>
              </TouchableOpacity>
            </View>
          </AppCard>

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

          <View style={s.companySection}>
            <AppSwitch
              label="Klient jest firmą"
              value={isCompanyRental}
              onValueChange={(val) => {
                setIsCompanyRental(val);
                if (!val) {
                  setCompanyNip('');
                  setVatPayerStatus(null);
                }
              }}
            />
            {isCompanyRental && (
              <View style={s.companyFields}>
                <AppInput
                  label="NIP"
                  value={companyNip}
                  onChangeText={setCompanyNip}
                  keyboardType="numeric"
                  maxLength={10}
                  placeholder="0000000000"
                  containerStyle={s.mb12}
                />
                <Text style={s.fieldLabel}>Płatnik VAT</Text>
                <View style={s.vatChipRow}>
                  {VAT_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      style={[s.vatChip, vatPayerStatus === opt.value && s.vatChipActive]}
                      onPress={() => setVatPayerStatus(opt.value)}
                    >
                      <Text
                        style={[s.vatChipText, vatPayerStatus === opt.value && s.vatChipTextActive]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>

          <AppButton
            title="Dalej"
            onPress={handleProceedWithExisting}
            fullWidth
            containerStyle={s.mt8}
          />
        </ScrollView>
      ) : (
        <FlatList
          style={s.list}
          contentContainerStyle={s.listContent}
          data={customers ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AppCard
              cardStyle={s.mb12}
              onPress={() =>
                setPendingExistingCustomer({
                  id: item.id,
                  name: `${item.firstName} ${item.lastName}`,
                })
              }
            >
              <Text style={s.custName}>
                {item.firstName} {item.lastName}
              </Text>
              <Text style={s.custSub}>{item.phone}</Text>
              {item.email && <Text style={s.custSub}>{item.email}</Text>}
            </AppCard>
          )}
          ListEmptyComponent={
            searchQuery.length >= 2 && !isLoading ? (
              <EmptyState heading={t('empty.noCustomer')} body={t('empty.noCustomerBody')} />
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
      )}

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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={s.flex1}
          >
            <ScrollView contentContainerStyle={s.modalScroll} keyboardShouldPersistTaps="handled">
              <Text style={s.modalHeading}>{t('wizard.newCustomer')}</Text>

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
                    error={(errors as Record<string, { message?: string }>).idIssuedBy?.message}
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
                    error={(errors as Record<string, { message?: string }>).idExpiryDate?.message}
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
                    error={
                      (errors as Record<string, { message?: string }>).licenseCategory?.message
                    }
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
                    error={
                      (errors as Record<string, { message?: string }>).licenseIssuedBy?.message
                    }
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
                    error={
                      (errors as Record<string, { message?: string }>).licenseBookletNumber?.message
                    }
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
                    error={(errors as Record<string, { message?: string }>).street?.message}
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
                      error={(errors as Record<string, { message?: string }>).houseNumber?.message}
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
                      error={
                        (errors as Record<string, { message?: string }>).apartmentNumber?.message
                      }
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
                      error={(errors as Record<string, { message?: string }>).postalCode?.message}
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
                      error={(errors as Record<string, { message?: string }>).city?.message}
                      containerStyle={s.fieldCity}
                    />
                  )}
                />
              </View>

              <AppButton
                title="🔍 Sprawdź uprawnienia kierowcy (gov.pl)"
                onPress={() =>
                  Linking.openURL(
                    'https://moj.gov.pl/uslugi/engine/ng/index?xFormsAppName=UprawnieniaKierowcow&xFormsOrigin=EXTERNAL',
                  )
                }
                variant="secondary"
                fullWidth
                containerStyle={s.mb12}
              />

              {/* Company rental section */}
              <View style={[s.companySection, { marginTop: spacing.lg }]}>
                <AppSwitch
                  label="Klient jest firmą"
                  value={isCompanyRental}
                  onValueChange={(val) => {
                    setIsCompanyRental(val);
                    if (!val) {
                      setCompanyNip('');
                      setVatPayerStatus(null);
                    }
                  }}
                />
                {isCompanyRental && (
                  <View style={s.companyFields}>
                    <AppInput
                      label="NIP"
                      value={companyNip}
                      onChangeText={setCompanyNip}
                      keyboardType="numeric"
                      maxLength={10}
                      placeholder="0000000000"
                      containerStyle={s.mb12}
                    />
                    <Text style={s.fieldLabel}>Płatnik VAT</Text>
                    <View style={s.vatChipRow}>
                      {VAT_OPTIONS.map((opt) => (
                        <Pressable
                          key={opt.value}
                          style={[s.vatChip, vatPayerStatus === opt.value && s.vatChipActive]}
                          onPress={() => setVatPayerStatus(opt.value)}
                        >
                          <Text
                            style={[
                              s.vatChipText,
                              vatPayerStatus === opt.value && s.vatChipTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </View>

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
        onRequestClose={() => setShowDraftResume(false)}
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

      {/* ID card guide overlay (front only) */}
      <DocumentGuideOverlay
        visible={idScan.phase === 'front_guide'}
        instruction={getGuideInstruction('ID_CARD')}
        step="Przod (1/2)"
        onCapture={idScan.capturePhoto}
        onClose={idScan.reset}
      />

      {/* ID card: front captured → prompt for back */}
      <BackScanPrompt
        visible={idScan.phase === 'front_captured'}
        onScanBack={idScan.captureBackPhoto}
        onSkip={idScan.skipBack}
        onClose={idScan.reset}
      />

      {/* Driver license guide overlay (front only) */}
      <DocumentGuideOverlay
        visible={licenseScan.phase === 'front_guide'}
        instruction={getGuideInstruction('DRIVER_LICENSE')}
        step="Przod (1/2)"
        onCapture={licenseScan.capturePhoto}
        onClose={licenseScan.reset}
      />

      {/* Driver license: front captured → prompt for back */}
      <BackScanPrompt
        visible={licenseScan.phase === 'front_captured'}
        onScanBack={licenseScan.captureBackPhoto}
        onSkip={licenseScan.skipBack}
        onClose={licenseScan.reset}
      />

      {/* ID card confirmation (new customer path only) */}
      {!pendingExistingCustomer &&
        idScan.phase === 'review' &&
        idScan.ocrResult &&
        idScan.frontUri && (
          <DocumentConfirmation
            visible
            documentType="ID_CARD"
            frontUri={idScan.frontUri}
            ocrFields={idScan.ocrResult as IdCardOcrFields}
            onConfirm={handleIdConfirm}
            onDiscard={handleIdDiscard}
          />
        )}

      {/* Driver license confirmation (new customer path only) */}
      {!pendingExistingCustomer &&
        licenseScan.phase === 'review' &&
        licenseScan.ocrResult &&
        licenseScan.frontUri && (
          <DocumentConfirmation
            visible
            documentType="DRIVER_LICENSE"
            frontUri={licenseScan.frontUri}
            ocrFields={licenseScan.ocrResult as DriverLicenseOcrFields}
            onConfirm={handleLicenseConfirm}
            onDiscard={handleLicenseDiscard}
          />
        )}

      {/* ID card diff view for existing customer */}
      {showIdDiff && idScan.ocrResult && existingCustomerData && (
        <DocumentDiffView
          visible
          ocrFields={idScan.ocrResult as unknown as Record<string, string | null>}
          currentFields={existingIdFields}
          fieldLabels={ID_FIELD_LABELS}
          onUpdate={handleIdDiffUpdate}
          onKeepCurrent={handleIdDiffKeep}
        />
      )}

      {/* Driver license diff view for existing customer */}
      {showLicenseDiff && licenseScan.ocrResult && existingCustomerData && (
        <DocumentDiffView
          visible
          ocrFields={licenseScan.ocrResult as unknown as Record<string, string | null>}
          currentFields={existingLicenseFields}
          fieldLabels={LICENSE_FIELD_LABELS}
          onUpdate={handleLicenseDiffUpdate}
          onKeepCurrent={handleLicenseDiffKeep}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  stepTitle: {
    marginTop: spacing.base,
    paddingHorizontal: spacing.base,
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: '600',
    color: colors.charcoal,
  },
  mt16: { marginTop: spacing.base },
  mt8: { marginTop: spacing.sm },
  mb12: { marginBottom: spacing.md },
  list: { marginTop: spacing.base, flex: 1 },
  listContent: { paddingHorizontal: spacing.base, paddingBottom: 100 },
  custName: { fontFamily: fonts.body, fontSize: 16, fontWeight: '500', color: colors.charcoal },
  custSub: { marginTop: 4, fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  flex1: { flex: 1 },
  modalRoot: { flex: 1, backgroundColor: colors.cream },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: '600',
    color: colors.charcoal,
  },
  modalClose: { fontFamily: fonts.body, color: colors.forestGreen, fontSize: 16 },
  modalScroll: { padding: spacing.base, paddingBottom: 40 },
  modalHeading: {
    marginBottom: spacing.base,
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: '600',
    color: colors.charcoal,
  },
  searchHint: {
    paddingHorizontal: spacing.base,
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.warmGray,
  },
  spinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginTop: spacing.sm,
    gap: 8,
  },
  spinnerText: { fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  sectionHeading: {
    marginTop: spacing.lg,
    marginBottom: spacing.base,
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: '600',
    color: colors.charcoal,
  },
  fieldRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  fieldHalf: { flex: 1 },
  fieldRowPostal: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  fieldPostal: { flex: 2 },
  fieldCity: { flex: 3 },
  scanButtonsContainer: { gap: spacing.md, marginBottom: spacing.lg },
  existingCustomerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeButton: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.forestGreen,
    fontWeight: '500',
  },
  companySection: { marginTop: spacing.lg },
  companyFields: { marginTop: spacing.md },
  fieldLabel: {
    marginBottom: 4,
    fontFamily: fonts.body,
    fontWeight: '500',
    fontSize: 13,
    color: colors.warmGray,
  },
  vatChipRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  vatChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.sand,
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  vatChipActive: {
    borderColor: colors.forestGreen,
    backgroundColor: colors.sageTint,
  },
  vatChipText: { fontFamily: fonts.body, fontSize: 14, color: colors.warmGray },
  vatChipTextActive: { color: colors.forestGreen, fontWeight: '500' },
});
