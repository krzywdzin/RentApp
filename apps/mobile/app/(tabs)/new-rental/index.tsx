import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { CreateCustomerSchema, type CreateCustomerInput } from '@rentapp/shared';
import Toast from 'react-native-toast-message';

import { WizardStepper } from '@/components/WizardStepper';
import { SearchBar } from '@/components/SearchBar';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { useRentalDraftStore } from '@/stores/rental-draft.store';
import { useCustomerSearch, useCreateCustomer } from '@/hooks/use-customers';

const WIZARD_LABELS = ['Klient', 'Pojazd', 'Daty', 'Umowa', 'Podpisy'];

export default function CustomerStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useRentalDraftStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDraftResume, setShowDraftResume] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const { data: customers, isLoading } = useCustomerSearch(searchQuery);
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
    bottomSheetRef.current?.expand();
  }, []);

  const handleCreateCustomer = useCallback(
    async (data: CreateCustomerInput) => {
      try {
        const customer = await createCustomer.mutateAsync(data);
        const name = `${customer.firstName} ${customer.lastName}`;
        bottomSheetRef.current?.close();
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
      4: '/(tabs)/new-rental/signatures',
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

  const snapPoints = useMemo(() => ['85%'], []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <WizardStepper
        currentStep={1}
        totalSteps={5}
        labels={WIZARD_LABELS}
      />

      <Text className="mt-4 px-4 text-xl font-semibold text-zinc-900">
        {t('wizard.step1')}
      </Text>

      <View className="mt-4">
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('wizard.customerSearch')}
        />
      </View>

      <FlatList
        className="mt-4 flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        data={customers ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AppCard
            className="mb-3"
            onPress={() =>
              handleSelectCustomer(
                item.id,
                `${item.firstName} ${item.lastName}`,
              )
            }
          >
            <Text className="text-base font-semibold text-zinc-900">
              {item.firstName} {item.lastName}
            </Text>
            <Text className="mt-1 text-[13px] text-zinc-500">
              {item.phone}
            </Text>
            {item.email && (
              <Text className="text-[13px] text-zinc-500">{item.email}</Text>
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
          <View className="mt-2">
            <AppButton
              title={t('wizard.newCustomer')}
              variant="secondary"
              onPress={handleNewCustomer}
              fullWidth
            />
          </View>
        }
      />

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: '#FFFFFF' }}
        handleIndicatorStyle={{ backgroundColor: '#D4D4D8' }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          <Text className="mb-4 text-xl font-semibold text-zinc-900">
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
                className="mb-3"
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
                className="mb-3"
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
                className="mb-3"
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
                className="mb-3"
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
                className="mb-3"
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
                className="mb-3"
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
                className="mb-3"
              />
            )}
          />

          <AppButton
            title={t('common.save')}
            onPress={handleSubmit(handleCreateCustomer)}
            loading={createCustomer.isPending}
            fullWidth
            className="mt-2"
          />
        </BottomSheetScrollView>
      </BottomSheet>

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
