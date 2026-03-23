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
