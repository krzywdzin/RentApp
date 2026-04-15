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
