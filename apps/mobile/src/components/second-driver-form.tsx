import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import type { IdCardOcrFields, DriverLicenseOcrFields } from '@rentapp/shared';

import { AppInput } from '@/components/AppInput';
import { AppButton } from '@/components/AppButton';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { DocumentScanButton } from '@/components/DocumentScanner/DocumentScanButton';
import { DocumentGuideOverlay } from '@/components/DocumentScanner/DocumentGuideOverlay';
import { BackScanPrompt } from '@/components/DocumentScanner/BackScanPrompt';
import { DocumentConfirmation } from '@/components/DocumentScanner/DocumentConfirmation';
import { useDocumentScan } from '@/hooks/use-document-scan';
import { useRentalDraftStore, type SecondDriverData } from '@/stores/rental-draft.store';
import apiClient from '@/api/client';
import { colors, fonts, spacing } from '@/lib/theme';

interface SecondDriverFormProps {
  rentalId: string;
  onDriverCreated: (driverId: string | null) => void;
  onDriverRemoved: () => void;
}

const EMPTY_DRIVER: SecondDriverData = {
  firstName: '',
  lastName: '',
  pesel: '',
  idNumber: '',
  licenseNumber: '',
  licenseCategory: 'B',
  street: '',
  houseNumber: '',
  postalCode: '',
  city: '',
  phone: '',
};

export function SecondDriverForm({ rentalId, onDriverCreated, onDriverRemoved }: SecondDriverFormProps) {
  const draft = useRentalDraftStore();
  const [form, setForm] = useState<SecondDriverData>(draft.secondDriver ?? EMPTY_DRIVER);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // OCR convenience (RODO: zdjęcia zostają lokalnie, serwer tylko wyciąga dane)
  const idScan = useDocumentScan('ID_CARD');
  const licenseScan = useDocumentScan('DRIVER_LICENSE');
  const [idScanDone, setIdScanDone] = useState(false);
  const [licenseScanDone, setLicenseScanDone] = useState(false);
  const [showRescanConfirm, setShowRescanConfirm] = useState<'ID_CARD' | 'DRIVER_LICENSE' | null>(
    null,
  );

  const driverId = draft.secondDriverId;
  const hasSavedDriver = !!driverId || !!draft.secondDriver;
  const cepikStatus = draft.secondDriverCepikStatus;

  const updateField = useCallback((field: keyof SecondDriverData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleIdScanPress = useCallback(() => {
    if (idScanDone) {
      setShowRescanConfirm('ID_CARD');
    } else {
      idScan.startScan();
    }
  }, [idScanDone, idScan]);

  const handleLicenseScanPress = useCallback(() => {
    if (licenseScanDone) {
      setShowRescanConfirm('DRIVER_LICENSE');
    } else {
      licenseScan.startScan();
    }
  }, [licenseScanDone, licenseScan]);

  const handleRescanConfirm = useCallback(() => {
    const type = showRescanConfirm;
    setShowRescanConfirm(null);
    if (type === 'ID_CARD') {
      setIdScanDone(false);
      idScan.reset();
      idScan.startScan();
    } else if (type === 'DRIVER_LICENSE') {
      setLicenseScanDone(false);
      licenseScan.reset();
      licenseScan.startScan();
    }
  }, [showRescanConfirm, idScan, licenseScan]);

  const handleIdConfirm = useCallback(
    (fields: Record<string, string>) => {
      setForm((prev) => ({
        ...prev,
        firstName: fields.firstName || prev.firstName,
        lastName: fields.lastName || prev.lastName,
        pesel: fields.pesel || prev.pesel,
        idNumber: fields.documentNumber || prev.idNumber,
        street: fields.street || prev.street,
        houseNumber: fields.houseNumber || prev.houseNumber,
        postalCode: fields.postalCode || prev.postalCode,
        city: fields.city || prev.city,
      }));
      setIdScanDone(true);
      idScan.reset();
    },
    [idScan],
  );

  const handleLicenseConfirm = useCallback(
    (fields: Record<string, string>) => {
      setForm((prev) => ({
        ...prev,
        licenseNumber: fields.licenseNumber || prev.licenseNumber,
        licenseCategory: fields.categories || prev.licenseCategory,
      }));
      setLicenseScanDone(true);
      licenseScan.reset();
    },
    [licenseScan],
  );

  const handleIdDiscard = useCallback(() => {
    idScan.reset();
  }, [idScan]);

  const handleLicenseDiscard = useCallback(() => {
    licenseScan.reset();
  }, [licenseScan]);

  const handleSaveDriver = useCallback(async () => {
    if (!form.firstName || !form.lastName || !form.pesel) {
      Toast.show({ type: 'error', text1: 'Uzupelnij wymagane pola (imie, nazwisko, PESEL)' });
      return;
    }

    setIsSaving(true);
    try {
      if (!rentalId) {
        draft.updateDraft({
          secondDriver: form,
          secondDriverId: null,
          secondDriverCepikStatus: null,
        });
        onDriverCreated(null);
        Toast.show({ type: 'success', text1: 'Kierowca zapisany w szkicu' });
        return;
      }

      const { data } = await apiClient.post(`/rentals/${rentalId}/driver`, {
        firstName: form.firstName,
        lastName: form.lastName,
        pesel: form.pesel,
        idNumber: form.idNumber,
        licenseNumber: form.licenseNumber,
        licenseCategory: form.licenseCategory || 'B',
        street: form.street,
        houseNumber: form.houseNumber,
        postalCode: form.postalCode,
        city: form.city,
        phone: form.phone,
      });

      draft.updateDraft({
        secondDriver: form,
        secondDriverId: data.id,
        secondDriverCepikStatus: null,
      });
      onDriverCreated(data.id);

      Toast.show({ type: 'success', text1: 'Kierowca zapisany' });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Blad zapisu kierowcy';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setIsSaving(false);
    }
  }, [form, rentalId, draft, onDriverCreated]);

  const handleVerifyCepik = useCallback(async () => {
    if (!driverId) return;

    setIsVerifying(true);
    draft.updateDraft({ secondDriverCepikStatus: 'PENDING' });
    try {
      const { data } = await apiClient.post('/cepik/verify-driver', {
        driverId,
        rentalId,
      });

      const status = data.status ?? 'PENDING';
      draft.updateDraft({ secondDriverCepikStatus: status });

      Toast.show({
        type: status === 'PASSED' ? 'success' : status === 'FAILED' ? 'error' : 'info',
        text1: `CEPiK: ${status}`,
      });
    } catch (err: any) {
      draft.updateDraft({ secondDriverCepikStatus: 'ERROR' });
      Toast.show({ type: 'error', text1: 'Blad weryfikacji CEPiK' });
    } finally {
      setIsVerifying(false);
    }
  }, [driverId, rentalId, draft]);

  const handleDeleteDriver = useCallback(async () => {
    setIsDeleting(true);
    try {
      if (rentalId && driverId) {
        await apiClient.delete(`/rentals/${rentalId}/driver`);
      }
      draft.updateDraft({
        secondDriver: null,
        secondDriverId: null,
        secondDriverCepikStatus: null,
      });
      setForm(EMPTY_DRIVER);
      onDriverRemoved();
      Toast.show({ type: 'success', text1: 'Kierowca usuniety' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Blad usuwania kierowcy' });
    } finally {
      setIsDeleting(false);
    }
  }, [rentalId, driverId, draft, onDriverRemoved]);

  const cepikColor =
    cepikStatus === 'PASSED' ? colors.forestGreen :
    cepikStatus === 'FAILED' ? '#DC2626' :
    cepikStatus === 'PENDING' ? '#D4A853' :
    cepikStatus === 'ERROR' ? '#C75D3A' :
    colors.warmGray;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Drugi kierowca</Text>

      {/* If driver saved, show summary */}
      {hasSavedDriver ? (
        <View style={styles.summaryCard}>
          <Text style={styles.driverName}>
            {draft.secondDriver?.firstName} {draft.secondDriver?.lastName}
          </Text>
          {cepikStatus && (
            <View style={[styles.statusBadge, { backgroundColor: cepikColor + '20' }]}>
              <Text style={[styles.statusText, { color: cepikColor }]}>
                CEPiK: {cepikStatus}
              </Text>
            </View>
          )}

          <View style={styles.actionRow}>
            {driverId && (!cepikStatus || cepikStatus === 'ERROR') && (
              <AppButton
                title={isVerifying ? 'Sprawdzanie...' : 'Sprawdz CEPiK'}
                onPress={handleVerifyCepik}
                disabled={isVerifying}
                fullWidth={false}
              />
            )}
            <Pressable onPress={handleDeleteDriver} disabled={isDeleting} style={styles.deleteBtn}>
              {isDeleting ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Text style={styles.deleteText}>Usun kierowce</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        /* Driver form */
        <View style={styles.form}>
          <View style={styles.scanButtons}>
            <DocumentScanButton
              documentType="ID_CARD"
              label="Skanuj dowod osobisty"
              scanData={idScanDone && idScan.frontUri ? { frontUri: idScan.frontUri } : null}
              onPress={handleIdScanPress}
            />
            <DocumentScanButton
              documentType="DRIVER_LICENSE"
              label="Skanuj prawo jazdy"
              scanData={
                licenseScanDone && licenseScan.frontUri ? { frontUri: licenseScan.frontUri } : null
              }
              onPress={handleLicenseScanPress}
            />
          </View>

          <View style={styles.row}>
            <AppInput
              label="Imie *"
              value={form.firstName}
              onChangeText={(v) => updateField('firstName', v)}
              containerStyle={styles.halfInput}
            />
            <AppInput
              label="Nazwisko *"
              value={form.lastName}
              onChangeText={(v) => updateField('lastName', v)}
              containerStyle={styles.halfInput}
            />
          </View>

          <AppInput
            label="PESEL *"
            value={form.pesel}
            onChangeText={(v) => updateField('pesel', v)}
            keyboardType="numeric"
            maxLength={11}
          />

          <AppInput
            label="Nr dowodu osobistego"
            value={form.idNumber}
            onChangeText={(v) => updateField('idNumber', v)}
            autoCapitalize="characters"
          />

          <View style={styles.row}>
            <AppInput
              label="Nr prawa jazdy"
              value={form.licenseNumber}
              onChangeText={(v) => updateField('licenseNumber', v)}
              containerStyle={styles.halfInput}
            />
            <AppInput
              label="Kategoria"
              value={form.licenseCategory}
              onChangeText={(v) => updateField('licenseCategory', v)}
              containerStyle={styles.halfInput}
              placeholder="B"
            />
          </View>

          <View style={styles.row}>
            <AppInput
              label="Ulica"
              value={form.street}
              onChangeText={(v) => updateField('street', v)}
              containerStyle={styles.flex2}
            />
            <AppInput
              label="Nr domu"
              value={form.houseNumber}
              onChangeText={(v) => updateField('houseNumber', v)}
              containerStyle={styles.flex1}
            />
          </View>

          <View style={styles.row}>
            <AppInput
              label="Kod pocztowy"
              value={form.postalCode}
              onChangeText={(v) => updateField('postalCode', v)}
              containerStyle={styles.flex1}
              keyboardType="numeric"
              maxLength={6}
            />
            <AppInput
              label="Miasto"
              value={form.city}
              onChangeText={(v) => updateField('city', v)}
              containerStyle={styles.flex2}
            />
          </View>

          <AppInput
            label="Telefon"
            value={form.phone}
            onChangeText={(v) => updateField('phone', v)}
            keyboardType="phone-pad"
          />

          <AppButton
            title={isSaving ? 'Zapisywanie...' : 'Zapisz kierowce'}
            onPress={handleSaveDriver}
            disabled={isSaving}
            fullWidth
          />
        </View>
      )}

      {/* OCR overlays + confirmation modals (RODO: zdjęcia nie opuszczają urządzenia) */}
      <ConfirmationDialog
        visible={showRescanConfirm !== null}
        title="Skanuj ponownie?"
        body="Poprzednie zdjecia i dane ze skanu zostana zastapione."
        confirmLabel="Skanuj ponownie"
        cancelLabel="Nie, zachowaj"
        onConfirm={handleRescanConfirm}
        onCancel={() => setShowRescanConfirm(null)}
      />

      <DocumentGuideOverlay
        visible={idScan.phase === 'front_guide'}
        instruction="Umiesc przod dowodu w ramce"
        step="Przod (1/2)"
        onCapture={idScan.capturePhoto}
        onClose={idScan.reset}
      />
      <BackScanPrompt
        visible={idScan.phase === 'front_captured'}
        onScanBack={idScan.captureBackPhoto}
        onSkip={idScan.skipBack}
        onClose={idScan.reset}
      />

      <DocumentGuideOverlay
        visible={licenseScan.phase === 'front_guide'}
        instruction="Umiesc przod prawa jazdy w ramce"
        step="Przod (1/2)"
        onCapture={licenseScan.capturePhoto}
        onClose={licenseScan.reset}
      />
      <BackScanPrompt
        visible={licenseScan.phase === 'front_captured'}
        onScanBack={licenseScan.captureBackPhoto}
        onSkip={licenseScan.skipBack}
        onClose={licenseScan.reset}
      />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.base,
  },
  title: {
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing.sm,
  },
  form: {
    gap: spacing.sm,
  },
  scanButtons: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  summaryCard: {
    backgroundColor: colors.warmStone,
    borderRadius: 8,
    padding: spacing.base,
  },
  driverName: {
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: fonts.data,
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginTop: spacing.md,
  },
  deleteBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  deleteText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#DC2626',
  },
});
