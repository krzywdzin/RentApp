import React, { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';

import { WizardStepper } from '@/components/WizardStepper';
import { AppInput } from '@/components/AppInput';
import { AppButton } from '@/components/AppButton';
import { useRentalDraftStore } from '@/stores/rental-draft.store';
import { formatDateTime, formatCurrency } from '@/lib/format';

const WIZARD_LABELS = ['Klient', 'Pojazd', 'Daty', 'Umowa', 'Podpisy'];

interface DatesFormValues {
  startDate: Date;
  endDate: Date;
  dailyRateNet: string;
}

export default function DatesStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useRentalDraftStore();

  const defaultStartDate = draft.startDate
    ? new Date(draft.startDate)
    : new Date();
  const defaultEndDate = draft.endDate
    ? new Date(draft.endDate)
    : new Date(Date.now() + 86400000);

  const { control, handleSubmit, watch, setValue } = useForm<DatesFormValues>({
    defaultValues: {
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      dailyRateNet: draft.dailyRateNet
        ? String(draft.dailyRateNet / 100)
        : '',
    },
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const dailyRateStr = watch('dailyRateNet');

  const pricing = useMemo(() => {
    const rateZloty = parseFloat(dailyRateStr) || 0;
    const rateGrosze = Math.round(rateZloty * 100);
    const diffMs = endDate.getTime() - startDate.getTime();
    const days = Math.max(Math.ceil(diffMs / 86400000), 0);
    const totalNetGrosze = rateGrosze * days;
    const totalGrossGrosze = Math.round(totalNetGrosze * 1.23);

    return {
      days,
      rateGrosze,
      totalNetGrosze,
      totalGrossGrosze,
    };
  }, [startDate, endDate, dailyRateStr]);

  const handleStartDateChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') setShowStartPicker(false);
      if (date) {
        setValue('startDate', date);
        // If end date is before new start, push it forward
        if (date >= watch('endDate')) {
          setValue('endDate', new Date(date.getTime() + 86400000));
        }
      }
    },
    [setValue, watch],
  );

  const handleEndDateChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') setShowEndPicker(false);
      if (date) {
        setValue('endDate', date);
      }
    },
    [setValue],
  );

  const handleNext = useCallback(
    (data: DatesFormValues) => {
      if (data.endDate <= data.startDate) {
        Toast.show({
          type: 'error',
          text1: 'Data zakonczenia musi byc pozniejsza niz data rozpoczecia',
        });
        return;
      }

      const rateGrosze = Math.round((parseFloat(data.dailyRateNet) || 0) * 100);
      if (rateGrosze <= 0) {
        Toast.show({
          type: 'error',
          text1: 'Stawka dzienna musi byc wieksza niz 0',
        });
        return;
      }

      draft.updateDraft({
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        dailyRateNet: rateGrosze,
        step: 3,
      });
      router.push('/(tabs)/new-rental/contract');
    },
    [draft, router],
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <WizardStepper
        currentStep={3}
        totalSteps={5}
        labels={WIZARD_LABELS}
      />

      <Text className="mt-4 px-4 text-xl font-semibold text-zinc-900">
        {t('wizard.step3')}
      </Text>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Start Date */}
        <Text className="mb-1 text-[13px] text-zinc-500">
          Data rozpoczecia
        </Text>
        <Pressable
          className="mb-4 h-12 flex-row items-center rounded-xl border border-zinc-200 px-4"
          onPress={() => setShowStartPicker(true)}
        >
          <Text className="flex-1 text-base text-zinc-900">
            {formatDateTime(startDate)}
          </Text>
        </Pressable>

        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* End Date */}
        <Text className="mb-1 text-[13px] text-zinc-500">
          Data zakonczenia
        </Text>
        <Pressable
          className="mb-4 h-12 flex-row items-center rounded-xl border border-zinc-200 px-4"
          onPress={() => setShowEndPicker(true)}
        >
          <Text className="flex-1 text-base text-zinc-900">
            {formatDateTime(endDate)}
          </Text>
        </Pressable>

        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEndDateChange}
            minimumDate={new Date(startDate.getTime() + 3600000)}
          />
        )}

        {/* Daily Rate */}
        <Controller
          control={control}
          name="dailyRateNet"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label={t('wizard.dailyRate')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="decimal-pad"
              placeholder="0.00"
              className="mb-4"
            />
          )}
        />

        {/* Pricing Summary */}
        <View className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-[13px] text-zinc-500">Liczba dni</Text>
            <Text className="text-base font-semibold text-zinc-900">
              {pricing.days}
            </Text>
          </View>

          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-[13px] text-zinc-500">
              {t('wizard.dailyRate')}
            </Text>
            <Text className="text-base text-zinc-900">
              {formatCurrency(pricing.rateGrosze)}
            </Text>
          </View>

          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-[13px] text-zinc-500">Razem netto</Text>
            <Text className="text-base text-zinc-900">
              {formatCurrency(pricing.totalNetGrosze)}
            </Text>
          </View>

          <View className="mt-3 border-t border-zinc-200 pt-3 flex-row items-center justify-between">
            <Text className="text-base font-semibold text-zinc-900">
              {t('wizard.totalGross')}
            </Text>
            <Text className="text-lg font-semibold text-zinc-900">
              {formatCurrency(pricing.totalGrossGrosze)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-zinc-100 bg-white px-4 pb-8 pt-3">
        <AppButton
          title={t('common.next')}
          onPress={handleSubmit(handleNext)}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}
