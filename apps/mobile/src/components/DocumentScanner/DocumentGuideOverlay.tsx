import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Flashlight, FlashlightOff, X } from 'lucide-react-native';
import { colors, fonts, spacing } from '@/lib/theme';

interface DocumentGuideOverlayProps {
  visible: boolean;
  instruction: string;
  step: string;
  onCapture: () => void;
  onClose: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
// ID-1 aspect ratio: 85.6mm x 54mm = 1.586:1
const FRAME_WIDTH = SCREEN_WIDTH * 0.85;
const FRAME_HEIGHT = FRAME_WIDTH / 1.586;

export function DocumentGuideOverlay({
  visible,
  instruction,
  step,
  onCapture,
  onClose,
}: DocumentGuideOverlayProps) {
  const insets = useSafeAreaInsets();
  const [torchOn, setTorchOn] = useState(false);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        {/* Close button top-left */}
        <Pressable
          style={[s.closeButton, { top: insets.top + spacing.base }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Zamknij"
          hitSlop={12}
        >
          <X size={24} color="#fff" />
        </Pressable>

        {/* Torch toggle top-right */}
        <Pressable
          style={[s.torchButton, { top: insets.top + spacing.base }]}
          onPress={() => setTorchOn((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel="Latarka"
          hitSlop={12}
        >
          {torchOn ? (
            <Flashlight size={22} color="#fff" />
          ) : (
            <FlashlightOff size={22} color="#fff" />
          )}
        </Pressable>

        {/* Document frame cutout */}
        <View style={s.frameContainer}>
          <View style={s.frame} />
        </View>

        {/* Instructions */}
        <View style={s.instructionContainer}>
          <Text style={s.instructionText}>{instruction}</Text>
          <Text style={s.stepText}>{step}</Text>
        </View>

        {/* Capture button */}
        <View
          style={[
            s.captureContainer,
            { paddingBottom: Math.max(insets.bottom, 16) + 40 },
          ]}
        >
          <Pressable
            style={s.captureButton}
            onPress={onCapture}
            accessibilityRole="button"
            accessibilityLabel="Zrob zdjecie"
          >
            <Camera size={32} color="#fff" />
          </Pressable>
          <Text style={s.captureLabel}>Zrob zdjecie</Text>
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
  torchButton: {
    position: 'absolute',
    right: spacing.base,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 22,
    zIndex: 10,
  },
  frameContainer: {
    marginTop: -80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    borderWidth: 2,
    borderColor: colors.amberGlow,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  instructionContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  instructionText: {
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  stepText: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '400',
    color: '#fff',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  captureContainer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#fff',
    marginTop: spacing.sm,
  },
});
