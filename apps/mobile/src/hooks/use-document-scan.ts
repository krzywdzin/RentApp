import { useCallback, useReducer } from 'react';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

import type { DocumentType, IdCardOcrFields, DriverLicenseOcrFields } from '@rentapp/shared';
import type { ScanPhase, ScanState } from '@/lib/ocr/ocr-types';
import { parseIdCard } from '@/lib/ocr/parse-id-card';
import { parseDriverLicense } from '@/lib/ocr/parse-driver-license';

// ---------- State machine ----------

type ScanAction =
  | { type: 'START' }
  | { type: 'FRONT_CAPTURED'; uri: string }
  | { type: 'SHOW_BACK_GUIDE' }
  | { type: 'BACK_CAPTURED'; uri: string }
  | { type: 'SKIP_BACK' }
  | { type: 'PROCESSING' }
  | { type: 'REVIEW'; ocrResult: IdCardOcrFields | DriverLicenseOcrFields }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' };

const initialState: ScanState = {
  phase: 'idle',
  frontUri: null,
  backUri: null,
  ocrResult: null,
  error: null,
};

function scanReducer(state: ScanState, action: ScanAction): ScanState {
  switch (action.type) {
    case 'START':
      return { ...initialState, phase: 'front_guide' };
    case 'FRONT_CAPTURED':
      return { ...state, phase: 'front_captured', frontUri: action.uri };
    case 'SHOW_BACK_GUIDE':
      return { ...state, phase: 'back_guide' };
    case 'BACK_CAPTURED':
      return { ...state, phase: 'back_captured', backUri: action.uri };
    case 'SKIP_BACK':
      return { ...state, phase: 'back_captured', backUri: null };
    case 'PROCESSING':
      return { ...state, phase: 'processing' };
    case 'REVIEW':
      return { ...state, phase: 'review', ocrResult: action.ocrResult };
    case 'ERROR':
      return { ...state, phase: 'idle', error: action.message };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ---------- OCR helper ----------

async function tryExtractText(uri: string): Promise<string[]> {
  try {
    // expo-text-extractor requires EAS dev client build -- not available in Expo Go
    const { extractTextFromImage } = await import('expo-text-extractor');
    const result = await extractTextFromImage(uri);
    return Array.isArray(result) ? result : [result].filter(Boolean);
  } catch {
    // Module not available (Expo Go or missing native module)
    return [];
  }
}

function mergeIdCardResults(
  front: IdCardOcrFields,
  back: IdCardOcrFields,
): IdCardOcrFields {
  return {
    firstName: front.firstName ?? back.firstName,
    lastName: front.lastName ?? back.lastName,
    // PESEL is often on the back of modern Polish ID cards
    pesel: back.pesel ?? front.pesel,
    documentNumber: front.documentNumber ?? back.documentNumber,
  };
}

// ---------- Hook ----------

export function useDocumentScan(documentType: DocumentType) {
  const [state, dispatch] = useReducer(scanReducer, initialState);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Brak uprawnien do kamery',
        text2: 'Wlacz dostep do kamery w ustawieniach',
      });
      return false;
    }
    return true;
  }, []);

  const launchCamera = useCallback(async (): Promise<string | null> => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) {
      return null;
    }
    return result.assets[0].uri;
  }, []);

  const startScan = useCallback(() => {
    dispatch({ type: 'START' });
  }, []);

  const capturePhoto = useCallback(async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const uri = await launchCamera();

    if (state.phase === 'front_guide') {
      if (!uri) {
        // Canceled at front -> return to idle
        dispatch({ type: 'RESET' });
        return;
      }
      dispatch({ type: 'FRONT_CAPTURED', uri });
      dispatch({ type: 'SHOW_BACK_GUIDE' });
    } else if (state.phase === 'back_guide') {
      if (!uri) {
        // Canceled at back -> proceed to processing without back photo
        dispatch({ type: 'SKIP_BACK' });
      } else {
        dispatch({ type: 'BACK_CAPTURED', uri });
      }

      // Start OCR processing
      dispatch({ type: 'PROCESSING' });

      try {
        const frontTexts = state.frontUri
          ? await tryExtractText(state.frontUri)
          : [];
        const backTexts = uri ? await tryExtractText(uri) : [];

        let ocrResult: IdCardOcrFields | DriverLicenseOcrFields;

        if (documentType === 'ID_CARD') {
          const frontParsed = parseIdCard(frontTexts);
          const backParsed = parseIdCard(backTexts);
          ocrResult = mergeIdCardResults(frontParsed, backParsed);
        } else {
          // For driver license, combine front and back text
          ocrResult = parseDriverLicense([...frontTexts, ...backTexts]);
        }

        dispatch({ type: 'REVIEW', ocrResult });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Blad odczytu dokumentu';
        dispatch({ type: 'ERROR', message });
        Toast.show({
          type: 'error',
          text1: 'Blad OCR',
          text2: message,
        });
      }
    }
  }, [state.phase, state.frontUri, documentType, requestCameraPermission, launchCamera]);

  const skipBack = useCallback(async () => {
    dispatch({ type: 'SKIP_BACK' });
    dispatch({ type: 'PROCESSING' });

    try {
      const frontTexts = state.frontUri
        ? await tryExtractText(state.frontUri)
        : [];

      let ocrResult: IdCardOcrFields | DriverLicenseOcrFields;

      if (documentType === 'ID_CARD') {
        ocrResult = parseIdCard(frontTexts);
      } else {
        ocrResult = parseDriverLicense(frontTexts);
      }

      dispatch({ type: 'REVIEW', ocrResult });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Blad odczytu dokumentu';
      dispatch({ type: 'ERROR', message });
    }
  }, [state.frontUri, documentType]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    phase: state.phase,
    frontUri: state.frontUri,
    backUri: state.backUri,
    ocrResult: state.ocrResult,
    error: state.error,
    startScan,
    capturePhoto,
    skipBack,
    reset,
  };
}
