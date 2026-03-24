export enum ContractStatus {
  DRAFT = 'DRAFT',
  PARTIALLY_SIGNED = 'PARTIALLY_SIGNED',
  SIGNED = 'SIGNED',
  VOIDED = 'VOIDED',
}

export type SignatureType = 'customer_page1' | 'employee_page1' | 'customer_page2' | 'employee_page2';
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

// Data shape frozen in contractData JSON
export interface ContractFrozenData {
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
