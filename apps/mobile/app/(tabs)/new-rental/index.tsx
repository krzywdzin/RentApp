import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, ScrollView, TouchableOpacity } from 'react-native';
import { CreateCustomerSchema, type CreateCustomerInput } from '@rentapp/shared';
import Toast from 'react-native-toast-message';

import { WizardStepper } from '@/components/WizardStepper';
import { SearchBar } from '@/components/SearchBar';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { useRentalDraftStore, useRentalDraftHasHydrated } from '@/stores/rental-draft.store';
import { useCustomerSearch, useCreateCustomer } from '@/hooks/use-customers';
import { RENTAL_WIZARD_LABELS } from '@/lib/constants';
import { colors, fonts, spacing } from '@/lib/theme';

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

  const {
    control,
    handleSubmit,
    reset,
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
      licenseNumber: '',
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
});
