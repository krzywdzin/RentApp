export enum ContractStatus {
  DRAFT = 'DRAFT',
  PARTIALLY_SIGNED = 'PARTIALLY_SIGNED',
  SIGNED = 'SIGNED',
  VOIDED = 'VOIDED',
}

export type SignatureType = 'customer_page1' | 'employee_page1' | 'customer_page2' | 'employee_page2' | 'second_customer_page1' | 'second_customer_page2';
export type SignerRole = 'customer' | 'employee';

export interface ContractSignatureDto {
  id: string;
  contractId: string;
  signatureType: SignatureType;
  signerRole: SignerRole;
  signerId: string | null;
  signatureKey: string;
  contentHash: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  signedAt: string;
}

export interface ContractAnnexDto {
  id: string;
  contractId: string;
  annexNumber: number;
  changes: Record<string, any>;
  pdfKey: string | null;
  pdfGeneratedAt: string | null;
  emailSentAt: string | null;
  createdAt: string;
}

export interface ContractDto {
  id: string;
  contractNumber: string;
  rentalId: string;
  createdById: string;
  status: ContractStatus;
  contractData: Record<string, any>;
  contentHash: string;
  depositAmount: number | null;
  dailyRateNet: number;
  lateFeeNet: number | null;
  rodoConsentAt: string | null;
  damageSketchKey: string | null;
  pdfKey: string | null;
  pdfGeneratedAt: string | null;
  emailSentAt: string | null;
  emailSentTo: string | null;
  signatures: ContractSignatureDto[];
  annexes: ContractAnnexDto[];
  createdAt: string;
  updatedAt: string;
}

// Data shape frozen in contractData JSON — V1 (legacy, no version field)
export interface ContractFrozenDataV1 {
  company: { name: string; owner: string; address: string; phone: string };
  customer: {
    firstName: string; lastName: string; address: string | null;
    pesel: string; idNumber: string; idIssuedBy: string | null;
    licenseNumber: string; licenseCategory: string | null;
    phone: string; email: string | null;
  };
  vehicle: {
    registration: string; make: string; model: string;
    year: number; vin: string; mileage: number;
  };
  rental: {
    startDate: string; endDate: string;
    dailyRateNet: number; totalPriceNet: number;
    totalPriceGross: number; vatRate: number;
  };
  conditions: {
    depositAmount: number | null;
    dailyRateNet: number;
    lateFeeNet: number | null;
  };
}

// Data shape frozen in contractData JSON — V2 (Phase 34+)
export interface ContractFrozenDataV2 {
  version: 2;
  company: { name: string; owner: string; address: string; phone: string };
  customer: {
    firstName: string; lastName: string;
    street: string | null; houseNumber: string | null;
    postalCode: string | null; city: string | null;
    address: string | null; // backward compat: computed full address string
    pesel: string; idNumber: string; idIssuedBy: string | null;
    licenseNumber: string; licenseCategory: string | null;
    phone: string; email: string | null;
  };
  vehicle: {
    registration: string; make: string; model: string;
    year: number; vin: string; mileage: number;
    vehicleClassName: string | null;
  };
  rental: {
    startDate: string; endDate: string;
    dailyRateNet: number; totalPriceNet: number;
    totalPriceGross: number; vatRate: number;
    isCompanyRental: boolean;
    companyName: string | null;
    companyNip: string | null;
    vatPayerStatus: string | null;
    insuranceCaseNumber: string | null;
    termsHtml: string;
    termsNotes: string | null;
  };
  conditions: {
    depositAmount: number | null;
    dailyRateNet: number;
    lateFeeNet: number | null;
  };
  secondDriver: {
    firstName: string; lastName: string;
    pesel: string; idNumber: string;
    licenseNumber: string; licenseCategory: string | null;
    address: string | null; phone: string | null;
  } | null;
}

export type ContractFrozenData = ContractFrozenDataV1 | ContractFrozenDataV2;

export function isV2(data: ContractFrozenData): data is ContractFrozenDataV2 {
  return 'version' in data && (data as any).version === 2;
}
