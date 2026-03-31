import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Haptics from 'expo-haptics';
import SignatureCanvas, { type SignatureViewRef } from 'react-native-signature-canvas';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

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
  body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
  canvas { width: 100% !important; height: 100% !important; }
  .m-signature-pad { box-shadow: none; border: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
  .m-signature-pad--body { position: absolute; top: 0; left: 0; right: 0; bottom: 0; border: none; }
  .m-signature-pad--footer { display: none; margin: 0; padding: 0; }
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
  const { t } = useTranslation();

  // Lock landscape on mount; restore portrait on unmount
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

  // Clear the canvas when moving to the next signature step
  useEffect(() => {
    signatureRef.current?.clearSignature();
  }, [stepLabel]);

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
    Toast.show({
      type: 'info',
      text1: 'Podpis jest pusty',
      text2: 'Narysuj podpis przed zatwierdzeniem',
    });
  }, []);

  return (
    <View style={styles.root}>
      {/* Header bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerStep}>{stepLabel}</Text>
      </View>

      {/* Canvas — instruction is rendered as an overlay inside the canvas so
          the WebView layout is not shifted by the instruction text height,
          which would cause the signature to draw below the finger */}
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
          androidHardwareAccelerationDisabled={true}
          trimWhitespace={false}
          style={{ flex: 1 }}
        />

        {/* Instruction overlay — positioned above drawing area, does not affect canvas layout */}
        {instruction && (
          <View style={styles.instructionOverlay} pointerEvents="none">
            <Text style={styles.instructionText}>{instruction}</Text>
          </View>
        )}

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
          title={t('signatures.clear')}
          variant="secondary"
          onPress={handleClear}
          disabled={loading}
        />
        <AppButton
          title={t('signatures.confirm')}
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
  canvas: {
    marginHorizontal: 16,
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    position: 'relative',
  },
  instructionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  instructionText: {
    fontSize: 13,
    color: '#71717A',
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
