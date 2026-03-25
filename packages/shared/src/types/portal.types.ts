export interface PortalReturnInspectionData {
  fuelLevel?: number | null;
  cleanliness?: string | null;
  notes?: string | null;
  mileage?: number | null;
  areas?: { area: string; condition: string; note?: string }[];
  generalNotes?: string | null;
}

export interface PortalRentalDto {
  id: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleRegistration: string;
  startDate: string;
  endDate: string;
  status: string;
  dailyRateNet: number;
  totalPriceNet: number;
  totalPriceGross: number;
  vatRate: number;
  returnMileage: number | null;
  returnData: PortalReturnInspectionData | null;
  contractId: string | null;
  contractNumber: string | null;
  contractPdfUrl: string | null;
  createdAt: string;
}

export interface PortalCustomerInfo {
  firstName: string;
  lastName: string;
}
