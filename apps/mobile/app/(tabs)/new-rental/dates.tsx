import React, { useCallback, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';

import { WizardStepper } from '@/components/WizardStepper';
import { AppInput } from '@/components/AppInput';
import { AppButton } from '@/components/AppButton';
import { useRentalDraftStore } from '@/stores/rental-draft.store';
import { formatDateTime, formatCurrency } from '@/lib/format';
import { RENTAL_WIZARD_LABELS, VAT_MULTIPLIER, ONE_DAY_MS } from '@/lib/constants';
import { colors, fonts, spacing } from '@/lib/theme';

const DatesSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  dailyRateNet: z.string()
    .min(1, 'Stawka dzienna jest wymagana')
    .regex(/^\d+([.,]\d{1,2})?$/, 'Nieprawidlowy format stawki (np. 150 lub 150.00)'),
});

type DatesFormValues = z.infer<typeof DatesSchema>;

export default function DatesStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useRentalDraftStore();
  const insets = useSafeAreaInsets();

  const defaultStartDate = draft.startDate
    ? new Date(draft.startDate)
    : new Date();
  const defaultEndDate = draft.endDate
    ? new Date(draft.endDate)
    : new Date(Date.now() + ONE_DAY_MS);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<DatesFormValues>({
    resolver: zodResolver(DatesSchema),
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
    const rateZloty = parseFloat(dailyRateStr.replace(',', '.')) || 0;
    const rateGrosze = Math.round(rateZloty * 100);
    const diffMs = endDate.getTime() - startDate.getTime();
    const days = Math.max(Math.ceil(diffMs / ONE_DAY_MS), 0);
    const totalNetGrosze = rateGrosze * days;
    const totalGrossGrosze = Math.round(totalNetGrosze * VAT_MULTIPLIER);

    return {
      days,
      rateGrosze,
      totalNetGrosze,
      totalGrossGrosze,
    };
  }, [startDate, endDate, dailyRateStr]);

  const handleStartDateChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') setShowStartPicker(false);
      if (event.type === 'dismissed') return;
      if (!date) return;
      try {
        const t = date.getTime();
        if (!isFinite(t)) return;
        const newDate = new Date(t);
        setValue('startDate', newDate, { shouldValidate: false });
        const currentEnd = endDate instanceof Date && isFinite(endDate.getTime()) ? endDate : new Date();
        if (newDate >= currentEnd) {
          setValue('endDate', new Date(t + ONE_DAY_MS), { shouldValidate: false });
        }
      } catch {
        // ignore
      }
    },
    [setValue, endDate],
  );

  const handleEndDateChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') setShowEndPicker(false);
      if (event.type === 'dismissed') return;
      if (!date) return;
      try {
        const t = date.getTime();
        if (!isFinite(t)) return;
        setValue('endDate', new Date(t), { shouldValidate: false });
      } catch {
        // ignore
      }
    },
    [setValue, startDate],
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

      const rateGrosze = Math.round((parseFloat(data.dailyRateNet.replace(',', '.')) || 0) * 100);
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
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <WizardStepper
        currentStep={3}
        totalSteps={6}
        labels={RENTAL_WIZARD_LABELS}
      />

      <Text style={s.stepTitle}>
        {t('wizard.step3')}
      </Text>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex1}>
      <ScrollView
        style={s.scrollBody}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Start Date */}
        <Text style={s.fieldLabel}>Data rozpoczecia</Text>
        <Pressable
          style={s.dateField}
          onPress={() => setShowStartPicker(true)}
        >
          <Text style={s.dateFieldText}>{formatDateTime(startDate)}</Text>
        </Pressable>

        {/* End Date */}
        <Text style={s.fieldLabel}>Data zakonczenia</Text>
        <Pressable
          style={s.dateField}
          onPress={() => setShowEndPicker(true)}
        >
          <Text style={s.dateFieldText}>{formatDateTime(endDate)}</Text>
        </Pressable>

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
              error={errors.dailyRateNet?.message}
              containerStyle={s.mb16}
            />
          )}
        />

        {/* Pricing Summary */}
        <View style={s.summaryBox}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Liczba dni</Text>
            <Text style={s.summaryValue}>{pricing.days}</Text>
          </View>

          <View style={s.summaryRowMt}>
            <Text style={s.summaryLabel}>{t('wizard.dailyRate')}</Text>
            <Text style={s.summaryValueNormal}>{formatCurrency(pricing.rateGrosze)}</Text>
          </View>

          <View style={s.summaryRowMt}>
            <Text style={s.summaryLabel}>Razem netto</Text>
            <Text style={s.summaryValueNormal}>{formatCurrency(pricing.totalNetGrosze)}</Text>
          </View>

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>{t('wizard.totalGross')}</Text>
            <Text style={s.totalValue}>{formatCurrency(pricing.totalGrossGrosze)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Date pickers rendered outside ScrollView to avoid iOS crash with inline spinner */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
          // minimumDate crashes iOS with datetimepicker 8.4.x (GitHub issue #996)
          // Validation moved to handleStartDateChange; Android keeps the prop for UX
          minimumDate={Platform.OS === 'android' ? new Date() : undefined}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
          // minimumDate crashes iOS with datetimepicker 8.4.x (GitHub issue #996)
          // Validation moved to handleEndDateChange; Android keeps the prop for UX
          minimumDate={Platform.OS === 'android' ? new Date(startDate.getTime() + 3600000) : undefined}
        />
      )}

      </KeyboardAvoidingView>

      {/* Bottom CTA */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <AppButton
          title={t('common.next')}
          onPress={handleSubmit(handleNext)}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  flex1: { flex: 1 },
  stepTitle: { marginTop: spacing.base, paddingHorizontal: spacing.base, fontFamily: fonts.display, fontSize: 20, fontWeight: '600', color: colors.charcoal },
  scrollBody: { flex: 1, paddingHorizontal: spacing.base, paddingTop: spacing.base },
  fieldLabel: { marginBottom: 4, fontFamily: fonts.body, fontWeight: '500', fontSize: 13, color: colors.warmGray },
  dateField: {
    marginBottom: spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateFieldText: { flex: 1, fontFamily: fonts.data, fontSize: 16, color: colors.charcoal },
  mb16: { marginBottom: spacing.base },
  summaryBox: {
    borderRadius: 8,
    backgroundColor: colors.warmStone,
    padding: spacing.base,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryRowMt: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  summaryValue: { fontFamily: fonts.data, fontSize: 16, color: colors.charcoal },
  summaryValueNormal: { fontFamily: fonts.data, fontSize: 16, color: colors.charcoal },
  totalRow: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.sand,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: { fontFamily: fonts.body, fontSize: 16, fontWeight: '500', color: colors.charcoal },
  totalValue: { fontFamily: fonts.display, fontWeight: '500', fontSize: 20, color: colors.forestGreen },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: colors.sand,
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.base,
    paddingTop: 12,
  },
});
