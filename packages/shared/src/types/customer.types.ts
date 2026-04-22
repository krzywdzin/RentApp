export interface CustomerDto {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  invoiceEmail: string | null;
  street: string | null;
  houseNumber: string | null;
  apartmentNumber: string | null;
  postalCode: string | null;
  city: string | null;
  pesel: string;
  idNumber: string;
  licenseNumber: string;
  idIssuedBy: string | null;
  idIssuedDate: string | null;
  idExpiryDate: string | null;
  licenseCategory: string | null;
  licenseIssuedBy: string | null;
  licenseIssuedDate: string | null;
  licenseBookletNumber: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSearchResultDto {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
}
