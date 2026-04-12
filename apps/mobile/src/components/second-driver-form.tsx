import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { AppInput } from '@/components/AppInput';
import { AppButton } from '@/components/AppButton';
import { useRentalDraftStore, type SecondDriverData } from '@/stores/rental-draft.store';
import apiClient from '@/api/client';
import { colors, fonts, spacing } from '@/lib/theme';

interface SecondDriverFormProps {
  rentalId: string;
  onDriverCreated: (driverId: string) => void;
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

  const driverId = draft.secondDriverId;
  const cepikStatus = draft.secondDriverCepikStatus;

  const updateField = useCallback((field: keyof SecondDriverData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveDriver = useCallback(async () => {
    if (!form.firstName || !form.lastName || !form.pesel) {
      Toast.show({ type: 'error', text1: 'Uzupelnij wymagane pola (imie, nazwisko, PESEL)' });
      return;
    }

    setIsSaving(true);
    try {
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
    if (!rentalId) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/rentals/${rentalId}/driver`);
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
  }, [rentalId, draft, onDriverRemoved]);

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
      {driverId ? (
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
            {(!cepikStatus || cepikStatus === 'ERROR') && (
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
