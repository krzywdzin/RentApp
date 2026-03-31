import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '@/lib/theme';
import { AppButton } from './AppButton';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'destructive' | 'default';
}

export function ConfirmationDialog({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmationDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>

          <View style={styles.buttonStack}>
            <AppButton
              title={confirmLabel}
              variant={variant === 'destructive' ? 'destructive' : 'primary'}
              onPress={onConfirm}
              fullWidth
            />
            <AppButton
              title={cancelLabel}
              variant="secondary"
              onPress={onCancel}
              fullWidth
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(44,44,44,0.5)',
    paddingHorizontal: 24,
  },
  dialog: {
    width: '100%',
    borderRadius: radii.lg,
    backgroundColor: colors.warmStone,
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.display,
    fontWeight: '500',
    color: colors.charcoal,
  },
  body: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.warmGray,
  },
  buttonStack: {
    marginTop: 24,
    gap: 12,
  },
});
