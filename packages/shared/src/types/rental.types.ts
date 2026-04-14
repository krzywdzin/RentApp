export interface PlaceLocation {
  address: string;
  placeId: string;
}

export enum VatPayerStatus {
  FULL_100 = 'FULL_100',
  HALF_50 = 'HALF_50',
  NONE = 'NONE',
}

export enum SettlementStatus {
  NIEROZLICZONY = 'NIEROZLICZONY',
  CZESCIOWO_ROZLICZONY = 'CZESCIOWO_ROZLICZONY',
  ROZLICZONY = 'ROZLICZONY',
  ANULOWANY = 'ANULOWANY',
}

export enum RentalStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  EXTENDED = 'EXTENDED',
  RETURNED = 'RETURNED',
}

export type ConditionRating = 'good' | 'minor_damage' | 'major_damage' | 'missing';

export const INSPECTION_AREAS = [
  'front', 'rear', 'left', 'right',
  'roof', 'interior', 'trunk', 'engine',
] as const;

export type InspectionArea = typeof INSPECTION_AREAS[number];

export interface AreaInspection {
  area: InspectionArea;
  condition: ConditionRating;
  note?: string;
}

export interface VehicleInspection {
  mileage: number;
  areas?: AreaInspection[];
  generalNotes?: string;
}

export interface RentalDto {
  id: string;
  vehicleId: string;
  customerId: string;
  createdById: string;
  startDate: string;
  endDate: string;
  status: RentalStatus;
  dailyRateNet: number;
  totalPriceNet: number;
  totalPriceGross: number;
  vatRate: number;
  handoverData: VehicleInspection | null;
  returnData: VehicleInspection | null;
  returnMileage: number | null;
  notes: string | null;
  overrodeConflict: boolean;
  isCompanyRental: boolean;
  companyNip: string | null;
  vatPayerStatus: VatPayerStatus | null;
  insuranceCaseNumber: string | null;
  pickupLocation: PlaceLocation | null;
  returnLocation: PlaceLocation | null;
  settlementStatus: SettlementStatus;
  settlementAmount: number | null;
  settlementNotes: string | null;
  settledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarVehicleEntry {
  id: string;
  registration: string;
  make: string;
  model: string;
  rentals: CalendarRentalEntry[];
}

export interface CalendarRentalEntry {
  id: string;
  startDate: string;
  endDate: string;
  status: RentalStatus;
  customerName: string;
  hasConflict: boolean;
}

export interface CalendarResponse {
  vehicles: CalendarVehicleEntry[];
  period: { from: string; to: string };
}

export interface PricingResult {
  dailyRateNet: number;
  totalPriceNet: number;
  totalPriceGross: number;
  vatRate: number;
}

/**
 * Rental with eagerly-loaded vehicle and customer relations.
 * Superset of fields used across all web views (list + detail).
 */
export interface RentalWithRelations extends RentalDto {
  vehicle?: {
    registration: string;
    make: string;
    model: string;
    mileage?: number;
  };
  customer?: {
    firstName: string;
    lastName: string;
    companyName?: string;
  };
}
