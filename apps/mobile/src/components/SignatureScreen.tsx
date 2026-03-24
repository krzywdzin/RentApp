import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Haptics from 'expo-haptics';
import SignatureCanvas, { type SignatureViewRef } from 'react-native-signature-canvas';

import { AppButton } from './AppButton';

interface SignatureScreenProps {
  title: string;
  stepLabel: string;
  onConfirm: (base64Png: string) => void;
  onBack: () => void;
  loading?: boolean;
  instruction?: string;
}

const SIGNATURE_WEB_STYLE = `
  .m-signature-pad { box-shadow: none; border: none; }
  .m-signature-pad--body { border: none; }
  .m-signature-pad--footer { display: none; margin: 0; padding: 0; }
  body, html { margin: 0; padding: 0; }
`;

export function SignatureScreen({
  title,
  stepLabel,
  onConfirm,
  onBack,
  loading = false,
  instruction,
}: SignatureScreenProps) {
  const signatureRef = useRef<SignatureViewRef>(null);

  useEffect(() => {
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE_LEFT,
    );

    return () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    };
  }, []);

  const handleClear = useCallback(() => {
    signatureRef.current?.clearSignature();
  }, []);

  const handleConfirm = useCallback(() => {
    signatureRef.current?.readSignature();
  }, []);

  const handleOK = useCallback(
    (signature: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onConfirm(signature);
    },
    [onConfirm],
  );

  const handleEmpty = useCallback(() => {
    // User tried to confirm empty canvas -- do nothing
  }, []);

  return (
    <View className="flex-1 bg-white">
      {/* Header bar */}
      <View className="h-12 flex-row items-center justify-between bg-zinc-50 px-4">
        <Text className="text-base font-semibold text-zinc-900">{title}</Text>
        <Text className="text-[13px] text-zinc-500">{stepLabel}</Text>
      </View>

      {/* Instruction */}
      {instruction && (
        <Text className="px-4 py-2 text-[13px] text-zinc-500">
          {instruction}
        </Text>
      )}

      {/* Canvas */}
      <View className="mx-4 flex-1 overflow-hidden rounded-xl border border-zinc-200">
        <SignatureCanvas
          ref={signatureRef}
          onOK={handleOK}
          onEmpty={handleEmpty}
          webStyle={SIGNATURE_WEB_STYLE}
          penColor="black"
          minWidth={2}
          maxWidth={3}
          backgroundColor="white"
          dotSize={3}
        />

        {/* Loading overlay */}
        {loading && (
          <View className="absolute inset-0 items-center justify-center bg-white/80">
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        )}
      </View>

      {/* Bottom controls */}
      <View className="flex-row items-center justify-between px-4 pb-4 pt-3">
        <AppButton
          title="Wyczysc podpis"
          variant="secondary"
          onPress={handleClear}
          disabled={loading}
        />
        <AppButton
          title="Zatwierdz podpis"
          onPress={handleConfirm}
          loading={loading}
        />
      </View>
    </View>
  );
}
