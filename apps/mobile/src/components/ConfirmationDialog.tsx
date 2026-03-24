import React from 'react';
import { Modal, Text, View } from 'react-native';
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
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full rounded-2xl bg-white p-6">
          <Text className="text-lg font-semibold text-zinc-900">{title}</Text>
          <Text className="mt-2 text-base text-zinc-500">{body}</Text>

          <View className="mt-6 flex-row gap-3">
            <View className="flex-1">
              <AppButton
                title={cancelLabel}
                variant="secondary"
                onPress={onCancel}
                fullWidth
              />
            </View>
            <View className="flex-1">
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
