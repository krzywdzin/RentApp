// Import vehicle DTO represents a single row from the fleet import spreadsheet.
// Validation is handled inline in VehiclesService.importFleet() since the
// spreadsheet rows require flexible column mapping (English/Polish headers).

export interface ImportVehicleRow {
  registration: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  fuelType: string;
  transmission: string;
  seatCount?: number;
  mileage?: number;
  insuranceCompany?: string;
  insurancePolicyNumber?: string;
  insuranceExpiry?: string;
  insuranceCoverage?: string;
  inspectionExpiry?: string;
  notes?: string;
}

export interface ImportFleetResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}
