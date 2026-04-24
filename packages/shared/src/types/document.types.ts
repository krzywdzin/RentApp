export const DOCUMENT_TYPES = ['ID_CARD', 'DRIVER_LICENSE'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_SIDES = ['front', 'back'] as const;
export type DocumentSide = (typeof DOCUMENT_SIDES)[number];

export interface IdCardOcrFields {
  firstName: string | null;
  lastName: string | null;
  pesel: string | null;
  documentNumber: string | null;
  issuedBy: string | null;
  expiryDate: string | null;
}

export interface DriverLicenseOcrFields {
  licenseNumber: string | null;
  categories: string | null;
  expiryDate: string | null;
  bookletNumber: string | null;
  issuedBy: string | null;
}

export interface DocumentPhotoDto {
  side: DocumentSide;
  url: string;
  thumbnailUrl: string | null;
}

export interface CustomerDocumentDto {
  id: string;
  customerId: string;
  type: DocumentType;
  photos: DocumentPhotoDto[];
  scannedAt: string;
  scannedById: string;
}

export const CUSTOMER_FILE_TYPES = ['DRIVER_GOV_REPORT'] as const;
export type CustomerFileType = (typeof CUSTOMER_FILE_TYPES)[number];

export interface CustomerFileDto {
  id: string;
  customerId: string;
  type: CustomerFileType;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedById: string;
  url: string;
}
