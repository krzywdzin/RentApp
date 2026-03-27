import React, { useCallback } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { WizardStepper } from '@/components/WizardStepper';
import { AppButton } from '@/components/AppButton';
import { useRentalDraftStore } from '@/stores/rental-draft.store';

const WIZARD_LABELS = ['Klient', 'Pojazd', 'Daty', 'Umowa', 'Zdjecia', 'Podpisy'];

interface PhotoPosition {
  key: string;
  label: string;
}

const PHOTO_POSITIONS: PhotoPosition[] = [
  { key: 'front', label: 'Przod' },
  { key: 'rear', label: 'Tyl' },
  { key: 'left_side', label: 'Lewa strona' },
  { key: 'right_side', label: 'Prawa strona' },
];

export default function PhotosStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useRentalDraftStore();

  const handleCapture = useCallback(
    async (position: string) => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Brak uprawnien do kamery',
          text2: 'Wlacz dostep do kamery w ustawieniach',
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        draft.updateDraft({
          photoUris: {
            ...draft.photoUris,
            [position]: result.assets[0].uri,
          },
        });
      }
    },
    [draft],
  );

  const handleNext = useCallback(() => {
    draft.updateDraft({ step: 5 });
    router.push('/(tabs)/new-rental/signatures');
  }, [draft, router]);

  const handleSkip = useCallback(() => {
    draft.updateDraft({ step: 5 });
    router.push('/(tabs)/new-rental/signatures');
  }, [draft, router]);

  const photoCount = Object.keys(draft.photoUris).length;

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <WizardStepper
        currentStep={5}
        totalSteps={6}
        labels={WIZARD_LABELS}
      />

      <Text style={s.stepTitle}>Zdjecia pojazdu</Text>
      <Text style={s.stepSubtitle}>
        Zrob zdjecia pojazdu przed wydaniem. Mozesz pominac ten krok.
      </Text>

      <View style={s.grid}>
        {PHOTO_POSITIONS.map((pos) => {
          const uri = draft.photoUris[pos.key];
          return (
            <Pressable
              key={pos.key}
              style={s.photoCard}
              onPress={() => handleCapture(pos.key)}
              accessibilityRole="button"
              accessibilityLabel={`Zrob zdjecie: ${pos.label}`}
            >
              {uri ? (
                <Image source={{ uri }} style={s.thumbnail} />
              ) : (
                <View style={s.placeholder}>
                  <Camera size={32} color="#A1A1AA" />
                </View>
              )}
              <Text style={s.photoLabel}>{pos.label}</Text>
              {uri && <View style={s.doneBadge}><Text style={s.doneBadgeText}>OK</Text></View>}
            </Pressable>
          );
        })}
      </View>

      <View style={s.bottomBar}>
        <AppButton
          title={`Dalej${photoCount > 0 ? ` (${photoCount}/4)` : ''}`}
          onPress={handleNext}
          fullWidth
        />
        {photoCount === 0 && (
          <Pressable style={s.skipButton} onPress={handleSkip}>
            <Text style={s.skipText}>Pomin zdjecia</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  stepTitle: {
    marginTop: 16,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '600',
    color: '#18181B',
  },
  stepSubtitle: {
    marginTop: 4,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#71717A',
    lineHeight: 20,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 20,
    gap: 8,
  },
  photoCard: {
    width: '47%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    textAlign: 'center',
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  doneBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#22C55E',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  doneBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 12,
    alignItems: 'center',
  },
  skipButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    color: '#3B82F6',
    fontWeight: '500',
  },
});
