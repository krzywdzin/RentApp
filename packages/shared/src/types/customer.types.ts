export interface CustomerDto {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  address: string | null;
  pesel: string;
  idNumber: string;
  licenseNumber: string;
  idIssuedBy: string | null;
  idIssuedDate: string | null;
  licenseCategory: string | null;
  licenseIssuedBy: string | null;
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
