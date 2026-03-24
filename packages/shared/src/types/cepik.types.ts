export const CepikVerificationStatus = {
  PENDING: 'PENDING',
  PASSED: 'PASSED',
  FAILED: 'FAILED',
  OVERRIDDEN: 'OVERRIDDEN',
  ERROR: 'ERROR',
} as const;
export type CepikVerificationStatus =
  (typeof CepikVerificationStatus)[keyof typeof CepikVerificationStatus];

export const CepikVerificationSource = {
  CEPIK_API: 'CEPIK_API',
  STUB: 'STUB',
  MANUAL_OVERRIDE: 'MANUAL_OVERRIDE',
} as const;
export type CepikVerificationSource =
  (typeof CepikVerificationSource)[keyof typeof CepikVerificationSource];

export interface CepikVerificationResult {
  verified: boolean;
  licenseValid: boolean;
  licenseSuspended: boolean;
  licenseCategories: string[];
  categoryMatch: boolean;
  checkedAt: string;
  source: CepikVerificationSource;
}

export interface CepikVerificationDto {
  id: string;
  customerId: string;
  rentalId: string | null;
  status: CepikVerificationStatus;
  result: CepikVerificationResult | null;
  checkedById: string;
  overrideReason: string | null;
  overriddenById: string | null;
  overriddenAt: string | null;
  createdAt: string;
}
