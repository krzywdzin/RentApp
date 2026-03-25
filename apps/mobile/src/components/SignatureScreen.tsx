import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
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
    <View style={styles.root}>
      {/* Header bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerStep}>{stepLabel}</Text>
      </View>

      {/* Instruction */}
      {instruction && (
        <Text style={styles.instruction}>{instruction}</Text>
      )}

      {/* Canvas */}
      <View style={styles.canvas}>
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
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        )}
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181B',
  },
  headerStep: {
    fontSize: 13,
    color: '#71717A',
  },
  instruction: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
    color: '#71717A',
  },
  canvas: {
    marginHorizontal: 16,
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
  },
});
