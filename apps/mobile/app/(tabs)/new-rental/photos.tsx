import React, { useCallback } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { WizardStepper } from '@/components/WizardStepper';
import { AppButton } from '@/components/AppButton';
import { useRentalDraftStore } from '@/stores/rental-draft.store';
import { RENTAL_WIZARD_LABELS } from '@/lib/constants';
import { colors, fonts, spacing } from '@/lib/theme';

interface PhotoPosition {
  key: string;
  label: string;
}

const PHOTO_POSITIONS: PhotoPosition[] = [
  { key: 'front_left_diagonal', label: 'Przod lewy skos' },
  { key: 'front_right_diagonal', label: 'Przod prawy skos' },
  { key: 'rear_left_diagonal', label: 'Tyl lewy skos' },
  { key: 'rear_right_diagonal', label: 'Tyl prawy skos' },
  { key: 'underside', label: 'Dol pojazdu' },
  { key: 'bumper', label: 'Zderzak' },
  { key: 'interior', label: 'Srodek' },
  { key: 'wheels', label: 'Kola' },
];

const REQUIRED_PHOTO_COUNT = PHOTO_POSITIONS.length;

export default function PhotosStep() {
  const router = useRouter();
  const draft = useRentalDraftStore();
  const insets = useSafeAreaInsets();

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
    const missing = PHOTO_POSITIONS.filter((pos) => !draft.photoUris[pos.key]);
    if (missing.length > 0) {
      Toast.show({
        type: 'error',
        text1: `Brakuje ${missing.length} wymaganych zdjec`,
        text2: missing
          .slice(0, 2)
          .map((pos) => pos.label)
          .join(', '),
      });
      return;
    }
    draft.updateDraft({ step: 5 });
    router.push('/(tabs)/new-rental/signatures');
  }, [draft, router]);

  const photoCount = PHOTO_POSITIONS.filter((pos) => !!draft.photoUris[pos.key]).length;

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <WizardStepper currentStep={5} totalSteps={6} labels={RENTAL_WIZARD_LABELS} />

      <Text style={s.stepTitle}>Zdjecia pojazdu</Text>
      <Text style={s.stepSubtitle}>
        Wymagane ujecia zostaja lokalnie na urzadzeniu i nie sa wysylane do serwera.
      </Text>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
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
                    <Camera size={32} color={colors.warmGray} />
                  </View>
                )}
                <Text style={s.photoLabel}>{pos.label}</Text>
                {uri && (
                  <View style={s.doneBadge}>
                    <Text style={s.doneBadgeText}>OK</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <AppButton
          title={`Dalej (${photoCount}/${REQUIRED_PHOTO_COUNT})`}
          onPress={handleNext}
          disabled={photoCount < REQUIRED_PHOTO_COUNT}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  stepTitle: {
    marginTop: spacing.base,
    paddingHorizontal: spacing.base,
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: '600',
    color: colors.charcoal,
  },
  stepSubtitle: {
    marginTop: 4,
    paddingHorizontal: spacing.base,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.warmGray,
    lineHeight: 20,
  },
  scroll: { flex: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 20,
    gap: 8,
  },
  photoCard: {
    width: '47%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    backgroundColor: colors.warmStone,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.sand,
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
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '500',
    color: colors.charcoal,
    backgroundColor: 'rgba(253,250,246,0.9)',
  },
  doneBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.forestGreen,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  doneBadgeText: {
    fontFamily: fonts.data,
    fontSize: 11,
    color: colors.cream,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: colors.sand,
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.base,
    paddingTop: 12,
    alignItems: 'center',
  },
});
