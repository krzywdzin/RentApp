import type {
  IdCardOcrFields,
  DriverLicenseOcrFields,
  DocumentType,
} from '@rentapp/shared';

export type ScanPhase =
  | 'idle'
  | 'front_guide'
  | 'front_captured'
  | 'back_guide'
  | 'back_captured'
  | 'processing'
  | 'review';

export interface ScanState {
  phase: ScanPhase;
  frontUri: string | null;
  backUri: string | null;
  ocrResult: IdCardOcrFields | DriverLicenseOcrFields | null;
  error: string | null;
}

export interface DocumentScanResult {
  frontUri: string;
  backUri: string | null;
  ocrFields: IdCardOcrFields | DriverLicenseOcrFields;
}

export type { IdCardOcrFields, DriverLicenseOcrFields, DocumentType };
