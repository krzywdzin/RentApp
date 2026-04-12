import { useCallback, useMemo, useState } from 'react';
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
import { AppSwitch } from '@/components/AppSwitch';
import { useRentalDraftStore } from '@/stores/rental-draft.store';
import { isValidNip } from '@rentapp/shared';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/format';
import { RENTAL_WIZARD_LABELS, VAT_MULTIPLIER, ONE_DAY_MS } from '@/lib/constants';
import { colors, fonts, spacing } from '@/lib/theme';

const DatesSchema = z.object({
  dailyRateNet: z.string()
    .min(1, 'Stawka dzienna jest wymagana')
    .regex(/^\d+([.,]\d{1,2})?$/, 'Nieprawidlowy format stawki (np. 150 lub 150.00)'),
  isCompanyRental: z.boolean().default(false),
  companyNip: z.string().nullable().optional(),
  vatPayerStatus: z.enum(['FULL_100', 'HALF_50', 'NONE']).nullable().optional(),
}).refine(
  (data) => !data.isCompanyRental || (data.companyNip && /^\d{10}$/.test(data.companyNip)),
  { message: 'NIP musi miec 10 cyfr', path: ['companyNip'] },
).refine(
  (data) => !data.companyNip || !data.isCompanyRental || isValidNip(data.companyNip),
  { message: 'Nieprawidlowy NIP', path: ['companyNip'] },
);

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
      dailyRateNet: draft.dailyRateNet
        ? String(draft.dailyRateNet / 100)
        : '',
      isCompanyRental: draft.isCompanyRental ?? false,
      companyNip: draft.companyNip ?? '',
      vatPayerStatus: draft.vatPayerStatus as 'FULL_100' | 'HALF_50' | 'NONE' | null ?? null,
    },
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  // Keep dates in local state to avoid react-hook-form/zod crashes with DateTimePicker
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const dailyRateStr = watch('dailyRateNet');
  const isCompanyRental = watch('isCompanyRental');

  const VAT_OPTIONS = [
    { label: '100%', value: 'FULL_100' as const },
    { label: '50%', value: 'HALF_50' as const },
    { label: 'Nie', value: 'NONE' as const },
  ];
  const selectedVat = watch('vatPayerStatus');

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
    (_event: DateTimePickerEvent, date?: Date) => {
      // Delay unmount to avoid crash on Android when native dialog closes
      setTimeout(() => setShowStartPicker(false), 0);
      if (!date) return;
      const d = new Date(date);
      setStartDate(d);
      if (d >= endDate) {
        setEndDate(new Date(d.getTime() + ONE_DAY_MS));
      }
    },
    [endDate],
  );

  const handleEndDateChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      setTimeout(() => setShowEndPicker(false), 0);
      if (!date) return;
      // Keep existing time, only change date
      const newEnd = new Date(date);
      newEnd.setHours(endDate.getHours(), endDate.getMinutes(), 0, 0);
      setEndDate(newEnd);
    },
    [endDate],
  );

  const handleEndTimeChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      setTimeout(() => setShowEndTimePicker(false), 0);
      if (!date) return;
      // Keep existing date, only change time
      const newEnd = new Date(endDate);
      newEnd.setHours(date.getHours(), date.getMinutes(), 0, 0);
      setEndDate(newEnd);
    },
    [endDate],
  );

  const handleNext = useCallback(
    (data: DatesFormValues) => {
      if (endDate <= startDate) {
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
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dailyRateNet: rateGrosze,
        isCompanyRental: data.isCompanyRental,
        companyNip: data.isCompanyRental ? (data.companyNip || null) : null,
        vatPayerStatus: data.isCompanyRental ? (data.vatPayerStatus || null) : null,
        step: 3,
      });
      router.push('/(tabs)/new-rental/contract');
    },
    [draft, router, startDate, endDate],
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
        <Text style={s.fieldLabel}>Data i godzina zwrotu</Text>
        <View style={s.dateRow}>
          <Pressable
            style={[s.dateField, s.dateFieldHalf]}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={s.dateFieldText}>{formatDate(endDate)}</Text>
          </Pressable>
          <Pressable
            style={[s.dateField, s.dateFieldHalf]}
            onPress={() => setShowEndTimePicker(true)}
          >
            <Text style={s.dateFieldText}>⏰ {endDate.getHours().toString().padStart(2,'0')}:{endDate.getMinutes().toString().padStart(2,'0')}</Text>
          </Pressable>
        </View>

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

        {/* Company rental toggle */}
        <View style={s.companySection}>
          <Controller
            control={control}
            name="isCompanyRental"
            render={({ field: { onChange, value } }) => (
              <AppSwitch
                label="Wynajem na firme"
                value={value}
                onValueChange={(val) => {
                  onChange(val);
                  if (!val) {
                    setValue('companyNip', null);
                    setValue('vatPayerStatus', null);
                  }
                }}
              />
            )}
          />

          {isCompanyRental && (
            <View style={s.companyFields}>
              <Controller
                control={control}
                name="companyNip"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="NIP"
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    maxLength={10}
                    placeholder="0000000000"
                    error={errors.companyNip?.message}
                    containerStyle={s.mb12}
                  />
                )}
              />

              <Text style={s.fieldLabel}>Platnik VAT</Text>
              <View style={s.vatChipRow}>
                {VAT_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[
                      s.vatChip,
                      selectedVat === opt.value && s.vatChipActive,
                    ]}
                    onPress={() => setValue('vatPayerStatus', opt.value)}
                  >
                    <Text
                      style={[
                        s.vatChipText,
                        selectedVat === opt.value && s.vatChipTextActive,
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
      </ScrollView>

      {/* Date pickers rendered outside ScrollView to avoid iOS crash with inline spinner */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={endDate}
          mode="time"
          display="default"
          is24Hour={true}
          onChange={handleEndTimeChange}
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
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.base,
  },
  dateField: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateFieldHalf: {
    flex: 1,
  },
  dateFieldText: { flex: 1, fontFamily: fonts.data, fontSize: 16, color: colors.charcoal },
  mb12: { marginBottom: spacing.md },
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
  companySection: { marginTop: spacing.lg },
  companyFields: { marginTop: spacing.md },
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
