import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Camera, X } from 'lucide-react-native';
import { colors, fonts, spacing } from '@/lib/theme';

interface BackScanPromptProps {
  visible: boolean;
  onScanBack: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export function BackScanPrompt({ visible, onScanBack, onSkip, onClose }: BackScanPromptProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <Pressable
          style={[s.closeButton, { top: insets.top + spacing.base }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Zamknij"
          hitSlop={12}
        >
          <X size={24} color="#fff" />
        </Pressable>

        <View style={s.content}>
          <View style={s.checkCircle}>
            <Check size={36} color="#fff" />
          </View>

          <Text style={s.title}>Przod zeskanowany!</Text>
          <Text style={s.subtitle}>
            Teraz obroc dokument i zeskanuj tylna strone, aby odczytac organ wydajacy i date
            waznosci.
          </Text>

          <Pressable
            style={s.scanBackButton}
            onPress={onScanBack}
            accessibilityRole="button"
            accessibilityLabel="Skanuj tylna strone"
          >
            <Camera size={24} color="#fff" />
            <Text style={s.scanBackText}>Skanuj tylna strone</Text>
          </Pressable>

          <Pressable
            style={s.skipButton}
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel="Pomin"
          >
            <Text style={s.skipText}>Pomin — uzupelnie recznie</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    left: spacing.base,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 22,
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  scanBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.forestGreen,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: spacing.base,
  },
  scanBackText: {
    fontFamily: fonts.body,
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textDecorationLine: 'underline',
  },
});
