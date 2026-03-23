export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  RENTED = 'RENTED',
  SERVICE = 'SERVICE',
  RETIRED = 'RETIRED',
}

export enum FuelType {
  PETROL = 'PETROL',
  DIESEL = 'DIESEL',
  LPG = 'LPG',
  HYBRID = 'HYBRID',
  ELECTRIC = 'ELECTRIC',
}

export enum TransmissionType {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
}

export enum InsuranceCoverageType {
  OC = 'OC',
  AC = 'AC',
  NNW = 'NNW',
}

export interface VehicleDto {
  id: string;
  registration: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  color: string | null;
  fuelType: FuelType;
  transmission: TransmissionType;
  seatCount: number;
  mileage: number;
  notes: string | null;
  status: VehicleStatus;
  photoUrl: string | null;
  isArchived: boolean;
  insurance: VehicleInsuranceDto | null;
  inspection: VehicleInspectionDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleInsuranceDto {
  id: string;
  companyName: string;
  policyNumber: string;
  expiryDate: string;
  coverageType: InsuranceCoverageType;
  documentUrl: string | null;
}

export interface VehicleInspectionDto {
  id: string;
  expiryDate: string;
  documentUrl: string | null;
}
