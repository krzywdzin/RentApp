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
  returnData: any | null;
  contractId: string | null;
  contractNumber: string | null;
  contractPdfUrl: string | null;
  createdAt: string;
}

export interface PortalCustomerInfo {
  firstName: string;
  lastName: string;
}
