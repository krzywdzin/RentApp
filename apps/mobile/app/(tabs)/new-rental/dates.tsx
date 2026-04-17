import { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PlacesAutocomplete } from '@/components/PlacesAutocomplete';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
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

const FUEL_LEVEL_OPTIONS = [
  { label: 'Pelny', value: 'FULL' as const },
  { label: 'Jak przy wydaniu', value: 'SAME_AS_PICKUP' as const },
  { label: 'Dowolny', value: 'ANY' as const },
];

const DatesSchema = z
  .object({
    dailyRateNet: z
      .string()
      .min(1, 'Stawka dzienna jest wymagana')
      .regex(/^\d+([.,]\d{1,2})?$/, 'Nieprawidlowy format stawki (np. 150 lub 150.00)'),
    isCompanyRental: z.boolean(),
    companyNip: z.string().nullable().optional(),
    vatPayerStatus: z.enum(['FULL_100', 'HALF_50', 'NONE']).nullable().optional(),
    dailyKmLimit: z.string().optional(),
    excessKmRate: z.string().optional(),
    deposit: z.string().optional(),
    returnDeadlineHour: z.string().optional(),
    lateReturnPenalty: z.string().optional(),
    fuelLevelRequired: z.enum(['FULL', 'SAME_AS_PICKUP', 'ANY']).nullable().optional(),
    fuelCharge: z.string().optional(),
    crossBorderAllowed: z.boolean(),
    dirtyReturnFee: z.string().optional(),
    deductible: z.string().optional(),
    deductibleWaiverFee: z.string().optional(),
    insuranceCaseNumber: z.string().optional(),
    termsNotes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isCompanyRental && (!data.companyNip || !/^\d{10}$/.test(data.companyNip))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'NIP musi miec 10 cyfr',
        path: ['companyNip'],
      });
    } else if (data.isCompanyRental && data.companyNip && !isValidNip(data.companyNip)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nieprawidlowy NIP',
        path: ['companyNip'],
      });
    }
  });

type DatesFormValues = z.infer<typeof DatesSchema>;

export default function DatesStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useRentalDraftStore();
  const insets = useSafeAreaInsets();

  const defaultStartDate = draft.startDate ? new Date(draft.startDate) : new Date();
  const defaultEndDate = draft.endDate
    ? new Date(draft.endDate)
    : new Date(Date.now() + ONE_DAY_MS);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DatesFormValues>({
    resolver: zodResolver(DatesSchema),
    defaultValues: {
      dailyRateNet: draft.dailyRateNet ? String(draft.dailyRateNet / 100) : '',
      isCompanyRental: draft.isCompanyRental ?? false,
      companyNip: draft.companyNip ?? '',
      vatPayerStatus: (draft.vatPayerStatus as 'FULL_100' | 'HALF_50' | 'NONE' | null) ?? null,
      dailyKmLimit: draft.dailyKmLimit ? String(draft.dailyKmLimit) : '',
      excessKmRate: draft.excessKmRate ? String(draft.excessKmRate / 100) : '',
      deposit: draft.deposit ? String(draft.deposit / 100) : '',
      returnDeadlineHour: draft.returnDeadlineHour ?? '',
      lateReturnPenalty: draft.lateReturnPenalty ? String(draft.lateReturnPenalty / 100) : '',
      fuelLevelRequired: draft.fuelLevelRequired ?? null,
      fuelCharge: draft.fuelCharge ? String(draft.fuelCharge / 100) : '',
      crossBorderAllowed: draft.crossBorderAllowed ?? false,
      dirtyReturnFee: draft.dirtyReturnFee ? String(draft.dirtyReturnFee / 100) : '',
      deductible: draft.deductible ? String(draft.deductible / 100) : '',
      deductibleWaiverFee: draft.deductibleWaiverFee ? String(draft.deductibleWaiverFee / 100) : '',
      insuranceCaseNumber: draft.insuranceCaseNumber ?? '',
      termsNotes: draft.termsNotes ?? '',
    },
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  // Keep dates in local state to avoid react-hook-form/zod crashes with DateTimePicker
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [pickupLocation, setPickupLocation] = useState(draft.pickupLocation);
  const [returnLocation, setReturnLocation] = useState(draft.returnLocation);
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

      const parseGrosze = (v?: string) => {
        if (!v) return null;
        const n = parseFloat(v.replace(',', '.'));
        return isNaN(n) ? null : Math.round(n * 100);
      };
      const parseInt0 = (v?: string) => {
        if (!v) return null;
        const n = parseInt(v, 10);
        return isNaN(n) ? null : n;
      };

      draft.updateDraft({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dailyRateNet: rateGrosze,
        isCompanyRental: data.isCompanyRental,
        companyNip: data.isCompanyRental ? data.companyNip || null : null,
        vatPayerStatus: data.isCompanyRental ? data.vatPayerStatus || null : null,
        pickupLocation,
        returnLocation,
        dailyKmLimit: parseInt0(data.dailyKmLimit),
        excessKmRate: parseGrosze(data.excessKmRate),
        deposit: parseGrosze(data.deposit),
        returnDeadlineHour: data.returnDeadlineHour || null,
        lateReturnPenalty: parseGrosze(data.lateReturnPenalty),
        fuelLevelRequired: data.fuelLevelRequired || null,
        fuelCharge: parseGrosze(data.fuelCharge),
        crossBorderAllowed: data.crossBorderAllowed,
        dirtyReturnFee: parseGrosze(data.dirtyReturnFee),
        deductible: parseGrosze(data.deductible),
        deductibleWaiverFee: parseGrosze(data.deductibleWaiverFee),
        insuranceCaseNumber: data.insuranceCaseNumber || null,
        termsNotes: data.termsNotes || null,
        step: 3,
      });
      router.push('/(tabs)/new-rental/contract');
    },
    [draft, router, startDate, endDate],
  );

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <WizardStepper currentStep={3} totalSteps={6} labels={RENTAL_WIZARD_LABELS} />

      <Text style={s.stepTitle}>{t('wizard.step3')}</Text>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex1}>
        <ScrollView
          style={s.scrollBody}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Start Date */}
          <Text style={s.fieldLabel}>Data rozpoczecia</Text>
          <Pressable style={s.dateField} onPress={() => setShowStartPicker(true)}>
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
              <Text style={s.dateFieldText}>
                ⏰ {endDate.getHours().toString().padStart(2, '0')}:
                {endDate.getMinutes().toString().padStart(2, '0')}
              </Text>
            </Pressable>
          </View>

          {/* Pickup Location */}
          <View style={{ zIndex: 2 }}>
            <PlacesAutocomplete
              label="Miejsce wydania pojazdu"
              value={pickupLocation}
              onSelect={(loc) => setPickupLocation(loc)}
            />
          </View>

          {/* Return Location */}
          <View style={{ zIndex: 1 }}>
            <PlacesAutocomplete
              label="Miejsce zdania pojazdu"
              value={returnLocation}
              onSelect={(loc) => setReturnLocation(loc)}
            />
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

          {/* Insurance case number */}
          <Controller
            control={control}
            name="insuranceCaseNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Nr sprawy ubezpieczeniowej (opcjonalnie)"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="np. PZU/2024/12345"
                containerStyle={{ marginBottom: spacing.md, marginTop: spacing.lg }}
              />
            )}
          />

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
                      style={[s.vatChip, selectedVat === opt.value && s.vatChipActive]}
                      onPress={() => setValue('vatPayerStatus', opt.value)}
                    >
                      <Text
                        style={[s.vatChipText, selectedVat === opt.value && s.vatChipTextActive]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Warunki najmu — per-rental terms */}
          <View style={s.termsSection}>
            <Text style={s.termsSectionTitle}>Warunki najmu</Text>

            <Controller
              control={control}
              name="dailyKmLimit"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Limit km/dobe"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  placeholder="np. 300"
                  containerStyle={s.mb12}
                />
              )}
            />

            <Controller
              control={control}
              name="excessKmRate"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Oplata za nadprzebieg (PLN/km netto)"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="np. 1.50"
                  containerStyle={s.mb12}
                />
              )}
            />

            <Controller
              control={control}
              name="deposit"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Kaucja (PLN)"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="np. 2000"
                  containerStyle={s.mb12}
                />
              )}
            />

            <Controller
              control={control}
              name="returnDeadlineHour"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Godzina zwrotu"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="np. 10:00"
                  containerStyle={s.mb12}
                />
              )}
            />

            <Controller
              control={control}
              name="lateReturnPenalty"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Kara za spoznienie (PLN/dobe netto)"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="np. 200"
                  containerStyle={s.mb12}
                />
              )}
            />

            <Text style={s.fieldLabel}>Wymagany poziom paliwa</Text>
            <Controller
              control={control}
              name="fuelLevelRequired"
              render={({ field: { value } }) => (
                <View style={s.vatChipRow}>
                  {FUEL_LEVEL_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      style={[s.vatChip, value === opt.value && s.vatChipActive]}
                      onPress={() =>
                        setValue('fuelLevelRequired', value === opt.value ? null : opt.value)
                      }
                    >
                      <Text style={[s.vatChipText, value === opt.value && s.vatChipTextActive]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            />

            <Controller
              control={control}
              name="fuelCharge"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Oplata za brak paliwa (PLN)"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="np. 500"
                  containerStyle={[s.mb12, { marginTop: spacing.md }]}
                />
              )}
            />

            <Controller
              control={control}
              name="crossBorderAllowed"
              render={({ field: { onChange, value } }) => (
                <AppSwitch
                  label="Wyjazd za granice dozwolony"
                  value={value}
                  onValueChange={onChange}
                />
              )}
            />

            <Controller
              control={control}
              name="dirtyReturnFee"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Oplata za brudne auto (PLN)"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="np. 150"
                  containerStyle={{ marginTop: spacing.md }}
                />
              )}
            />

            <Controller
              control={control}
              name="deductible"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Udzial wlasny w szkodzie (PLN)"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="np. 3000"
                  containerStyle={{ marginTop: spacing.md }}
                />
              )}
            />

            <Controller
              control={control}
              name="deductibleWaiverFee"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Zniesienie udzialu wlasnego (PLN/dobe)"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="np. 50"
                  containerStyle={{ marginTop: spacing.md }}
                />
              )}
            />

            <Controller
              control={control}
              name="termsNotes"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Dodatkowe uwagi do warunków najmu"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="np. Pojazd zostaje wydany z zadrapaniem na zderzaku tylnym"
                  multiline
                  numberOfLines={3}
                  containerStyle={{ marginTop: spacing.md }}
                />
              )}
            />
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
        <AppButton title={t('common.next')} onPress={handleSubmit(handleNext)} fullWidth />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  flex1: { flex: 1 },
  stepTitle: {
    marginTop: spacing.base,
    paddingHorizontal: spacing.base,
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: '600',
    color: colors.charcoal,
  },
  scrollBody: { flex: 1, paddingHorizontal: spacing.base, paddingTop: spacing.base },
  fieldLabel: {
    marginBottom: 4,
    fontFamily: fonts.body,
    fontWeight: '500',
    fontSize: 13,
    color: colors.warmGray,
  },
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
  summaryRowMt: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
  totalValue: {
    fontFamily: fonts.display,
    fontWeight: '500',
    fontSize: 20,
    color: colors.forestGreen,
  },
  termsSection: { marginTop: spacing.lg },
  termsSectionTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing.md,
  },
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
