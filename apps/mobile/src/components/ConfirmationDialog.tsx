import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
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

          <View style={styles.buttonRow}>
            <View style={styles.buttonCol}>
              <AppButton
                title={cancelLabel}
                variant="secondary"
                onPress={onCancel}
                fullWidth
              />
            </View>
            <View style={styles.buttonCol}>
              <AppButton
                title={confirmLabel}
                variant={variant === 'destructive' ? 'destructive' : 'primary'}
                onPress={onConfirm}
                fullWidth
              />
            </View>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 24,
  },
  dialog: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#18181B',
  },
  body: {
    marginTop: 8,
    fontSize: 16,
    color: '#71717A',
  },
  buttonRow: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 12,
  },
  buttonCol: {
    flex: 1,
  },
});
