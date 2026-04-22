import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, ChevronUp, Edit3, Plus, Square, X } from 'lucide-react-native';

import { WizardStepper } from '@/components/WizardStepper';
import { AppButton } from '@/components/AppButton';
import { TermsWebView } from '@/components/terms-webview';
import { SecondDriverForm } from '@/components/second-driver-form';
import { useRentalDraftStore } from '@/stores/rental-draft.store';
import apiClient from '@/api/client';
import { formatDateTime, formatCurrency } from '@/lib/format';
import { RENTAL_WIZARD_LABELS, VAT_MULTIPLIER, ONE_DAY_MS } from '@/lib/constants';
import { colors, fonts, spacing } from '@/lib/theme';

export default function ContractStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useRentalDraftStore();
  const insets = useSafeAreaInsets();

  const [defaultTermsHtml, setDefaultTermsHtml] = useState<string | null>(null);
  const [loadingTerms, setLoadingTerms] = useState(true);
  const [showTermsEditor, setShowTermsEditor] = useState(false);
  const [showSecondDriverForm, setShowSecondDriverForm] = useState(false);
  const [termsExpanded, setTermsExpanded] = useState(true);

  // Fetch default terms on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get('/settings/default_rental_terms');
        if (!cancelled) {
          setDefaultTermsHtml(data.value ?? '');
        }
      } catch {
        if (!cancelled) {
          setDefaultTermsHtml('<p>Nie udalo sie pobrac warunkow najmu.</p>');
        }
      } finally {
        if (!cancelled) setLoadingTerms(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const termsHtml = draft.rentalTerms ?? defaultTermsHtml ?? '';

  const days = (() => {
    if (!draft.startDate || !draft.endDate) return 0;
    const diffMs = new Date(draft.endDate).getTime() - new Date(draft.startDate).getTime();
    return Math.max(Math.ceil(diffMs / ONE_DAY_MS), 0);
  })();

  const totalNetGrosze = (draft.dailyRateNet ?? 0) * days;
  const totalGrossGrosze = Math.round(totalNetGrosze * VAT_MULTIPLIER);

  const handleToggleRodo = useCallback(() => {
    if (draft.rodoConsent) {
      draft.updateDraft({ rodoConsent: false, rodoTimestamp: null });
    } else {
      draft.updateDraft({ rodoConsent: true, rodoTimestamp: new Date().toISOString() });
    }
  }, [draft]);

  const handleToggleTermsAccepted = useCallback(() => {
    if (draft.termsAcceptedAt) {
      draft.updateDraft({ termsAcceptedAt: null });
    } else {
      draft.updateDraft({ termsAcceptedAt: new Date().toISOString() });
    }
  }, [draft]);

  const handleTermsHtmlChange = useCallback(
    (html: string) => {
      draft.updateDraft({ rentalTerms: html });
    },
    [draft],
  );

  const handleTermsNotesChange = useCallback(
    (text: string) => {
      draft.updateDraft({ termsNotes: text });
    },
    [draft],
  );

  const handleNext = useCallback(() => {
    draft.updateDraft({ step: 4 });
    router.push('/(tabs)/new-rental/photos');
  }, [draft, router]);

  const handleDriverCreated = useCallback((_driverId: string | null) => {
    // Driver saved, form will show summary card automatically via store
  }, []);

  const handleDriverRemoved = useCallback(() => {
    setShowSecondDriverForm(false);
  }, []);

  const canProceed = draft.rodoConsent && !!draft.termsAcceptedAt;

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <WizardStepper
        currentStep={4}
        totalSteps={6}
        labels={RENTAL_WIZARD_LABELS}
        onBack={router.canGoBack() ? router.back : undefined}
      />

      <Text style={s.stepTitle}>{t('wizard.step4')}</Text>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex1}>
        <ScrollView
          style={s.scrollBody}
          contentContainerStyle={{ paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. Contract Preview */}
          <View style={s.previewBox}>
            <Text style={s.sectionHeader}>Klient</Text>
            <Text style={s.sectionValue}>{draft.customerName ?? '-'}</Text>

            <Text style={[s.sectionHeader, s.mt16]}>Pojazd</Text>
            <Text style={s.sectionValue}>{draft.vehicleLabel ?? '-'}</Text>

            <Text style={[s.sectionHeader, s.mt16]}>Okres wynajmu</Text>
            <View style={s.datesRow}>
              <Text style={s.sectionValue}>
                {draft.startDate ? formatDateTime(draft.startDate) : '-'}
              </Text>
              <Text style={s.dash}>-</Text>
              <Text style={s.sectionValue}>
                {draft.endDate ? formatDateTime(draft.endDate) : '-'}
              </Text>
            </View>
            <Text style={s.daysText}>
              {days} {days === 1 ? 'dzien' : 'dni'}
            </Text>

            <Text style={[s.sectionHeader, s.mt16]}>Cennik</Text>
            <View style={s.mt4}>
              <View style={s.priceRow}>
                <Text style={s.priceLabel}>{t('wizard.dailyRate')}</Text>
                <Text style={s.priceValue}>{formatCurrency(draft.dailyRateNet ?? 0)}</Text>
              </View>
              <View style={s.priceRowMt}>
                <Text style={s.priceLabel}>Razem netto</Text>
                <Text style={s.priceValue}>{formatCurrency(totalNetGrosze)}</Text>
              </View>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>{t('wizard.totalGross')}</Text>
                <Text style={s.totalValue}>{formatCurrency(totalGrossGrosze)}</Text>
              </View>
            </View>
          </View>

          {/* 2. Terms Display */}
          <View style={s.termsSection}>
            <Pressable
              style={s.termsSectionHeader}
              onPress={() => setTermsExpanded(!termsExpanded)}
            >
              <Text style={s.termsSectionTitle}>Warunki najmu</Text>
              {termsExpanded ? (
                <ChevronUp size={20} color={colors.warmGray} />
              ) : (
                <ChevronDown size={20} color={colors.warmGray} />
              )}
            </Pressable>

            {termsExpanded && (
              <>
                {loadingTerms ? (
                  <ActivityIndicator style={s.mt16} color={colors.forestGreen} />
                ) : (
                  <TermsWebView html={termsHtml} editable={false} />
                )}
                <Pressable style={s.editTermsBtn} onPress={() => setShowTermsEditor(true)}>
                  <Edit3 size={16} color={colors.forestGreen} />
                  <Text style={s.editTermsBtnText}>Edytuj warunki</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* 3. Terms Notes */}
          <View style={s.notesSection}>
            <Text style={s.notesLabel}>Uwagi dodatkowe do warunkow</Text>
            <TextInput
              style={s.notesInput}
              multiline
              numberOfLines={3}
              placeholder="Uwagi dodatkowe do warunkow..."
              placeholderTextColor={colors.warmGray}
              value={draft.termsNotes ?? ''}
              onChangeText={handleTermsNotesChange}
              textAlignVertical="top"
            />
          </View>

          {/* 4. Terms Acceptance Checkbox */}
          <Pressable
            style={s.checkboxRow}
            onPress={handleToggleTermsAccepted}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !!draft.termsAcceptedAt }}
          >
            {draft.termsAcceptedAt ? (
              <View style={s.checkboxChecked}>
                <Check size={16} color={colors.cream} />
              </View>
            ) : (
              <View style={s.checkboxUnchecked}>
                <Square size={24} color={colors.sand} />
              </View>
            )}
            <Text style={s.checkboxText}>Zapoznałem/am się z warunkami najmu i akceptuję je</Text>
          </Pressable>

          {/* 5. Second Driver Section */}
          <View style={s.secondDriverSection}>
            {draft.secondDriverId ? (
              <SecondDriverForm
                rentalId={draft.rentalId ?? ''}
                onDriverCreated={handleDriverCreated}
                onDriverRemoved={handleDriverRemoved}
              />
            ) : showSecondDriverForm ? (
              <SecondDriverForm
                rentalId={draft.rentalId ?? ''}
                onDriverCreated={handleDriverCreated}
                onDriverRemoved={() => {
                  setShowSecondDriverForm(false);
                }}
              />
            ) : (
              <Pressable style={s.addDriverBtn} onPress={() => setShowSecondDriverForm(true)}>
                <Plus size={18} color={colors.forestGreen} />
                <Text style={s.addDriverBtnText}>Dodaj drugiego kierowce</Text>
              </Pressable>
            )}
          </View>

          {/* 6. RODO Consent */}
          <Pressable
            style={s.checkboxRow}
            onPress={handleToggleRodo}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: draft.rodoConsent }}
          >
            {draft.rodoConsent ? (
              <View style={s.checkboxChecked}>
                <Check size={16} color={colors.cream} />
              </View>
            ) : (
              <View style={s.checkboxUnchecked}>
                <Square size={24} color={colors.sand} />
              </View>
            )}
            <Text style={s.checkboxText}>{t('wizard.rodoConsent')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom CTA -- gated on both RODO and terms acceptance */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <AppButton
          title="Dalej do podpisow"
          onPress={handleNext}
          disabled={!canProceed}
          fullWidth
        />
      </View>

      {/* Terms Editor Modal */}
      <Modal
        visible={showTermsEditor}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTermsEditor(false)}
      >
        <SafeAreaView style={s.modalSafe}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Edytuj warunki najmu</Text>
            <Pressable onPress={() => setShowTermsEditor(false)} hitSlop={12}>
              <X size={24} color={colors.charcoal} />
            </Pressable>
          </View>
          <ScrollView style={s.flex1} contentContainerStyle={{ paddingBottom: 40 }}>
            <TermsWebView html={termsHtml} onHtmlChange={handleTermsHtmlChange} editable />
          </ScrollView>
          <View style={s.modalFooter}>
            <AppButton title="Zapisz zmiany" onPress={() => setShowTermsEditor(false)} fullWidth />
          </View>
        </SafeAreaView>
      </Modal>
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
  previewBox: {
    borderRadius: 8,
    backgroundColor: colors.warmStone,
    padding: spacing.base,
  },
  sectionHeader: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.warmGray,
  },
  sectionValue: { marginTop: 4, fontFamily: fonts.data, fontSize: 16, color: colors.charcoal },
  mt16: { marginTop: spacing.base },
  mt4: { marginTop: 4 },
  datesRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dash: { color: colors.warmGray },
  daysText: { marginTop: 4, fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceRowMt: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.warmGray },
  priceValue: { fontFamily: fonts.data, fontSize: 16, color: colors.charcoal },
  totalRow: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.sand,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: { fontFamily: fonts.body, fontSize: 16, fontWeight: '500', color: colors.charcoal },
  totalValue: {
    fontFamily: fonts.display,
    fontWeight: '500',
    fontSize: 18,
    color: colors.forestGreen,
  },

  // Terms section
  termsSection: {
    marginTop: spacing.xl,
  },
  termsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  termsSectionTitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '600',
    color: colors.charcoal,
  },
  editTermsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingVertical: 8,
  },
  editTermsBtnText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.forestGreen,
    fontWeight: '500',
  },

  // Notes
  notesSection: {
    marginTop: spacing.base,
  },
  notesLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '500',
    color: colors.warmGray,
    marginBottom: 4,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.sand,
    borderRadius: 8,
    padding: 12,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.charcoal,
    minHeight: 80,
    backgroundColor: '#fff',
  },

  // Checkboxes
  checkboxRow: { marginTop: spacing.xl, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkboxChecked: {
    marginTop: 2,
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: colors.forestGreen,
  },
  checkboxUnchecked: { marginTop: 2 },
  checkboxText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.charcoal,
  },

  // Second driver
  secondDriverSection: {
    marginTop: spacing.xl,
  },
  addDriverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.forestGreen,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addDriverBtnText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.forestGreen,
    fontWeight: '500',
  },

  // Bottom bar
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

  // Modal
  modalSafe: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: '600',
    color: colors.charcoal,
  },
  modalFooter: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.sand,
  },
});
