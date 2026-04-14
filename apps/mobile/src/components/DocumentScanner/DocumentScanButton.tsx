import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera } from 'lucide-react-native';
import type { DocumentType } from '@rentapp/shared';
import { colors, fonts, radii, spacing } from '@/lib/theme';

interface DocumentScanButtonProps {
  documentType: DocumentType;
  label: string;
  scanData: { frontUri: string } | null;
  onPress: () => void;
}

export function DocumentScanButton({
  documentType,
  label,
  scanData,
  onPress,
}: DocumentScanButtonProps) {
  if (scanData) {
    return (
      <Pressable
        style={s.scannedCard}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label} - Skanuj ponownie`}
      >
        <Image source={{ uri: scanData.frontUri }} style={s.thumbnail} />
        <View style={s.scannedInfo}>
          <Text style={s.scannedLabel}>Zeskanowano</Text>
          <Text style={s.rescanText}>Skanuj ponownie</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={s.outlinedButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Camera size={20} color={colors.forestGreen} />
      <Text style={s.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  outlinedButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.forestGreen,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    width: '100%',
  },
  buttonLabel: {
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: '600',
    color: colors.forestGreen,
  },
  scannedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmStone,
    borderRadius: radii.md,
    overflow: 'hidden',
    width: '100%',
  },
  thumbnail: {
    width: 64,
    height: 64,
    resizeMode: 'cover',
  },
  scannedInfo: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  scannedLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '500',
    color: colors.charcoal,
  },
  rescanText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.forestGreen,
    marginTop: 2,
  },
});
