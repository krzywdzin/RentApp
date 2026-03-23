import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const CreateVehicleSchema = z.object({
  registration: z.string().min(2).max(15),
  vin: z
    .string()
    .length(17)
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/i, 'Invalid VIN format'),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.number().int().min(1900).max(currentYear + 1),
  color: z.string().max(50).nullable().optional(),
  fuelType: z.enum(['PETROL', 'DIESEL', 'LPG', 'HYBRID', 'ELECTRIC']),
  transmission: z.enum(['MANUAL', 'AUTOMATIC']),
  seatCount: z.number().int().min(1).max(99).default(5),
  mileage: z.number().int().min(0).default(0),
  notes: z.string().max(1000).nullable().optional(),
});

export const UpdateVehicleSchema = CreateVehicleSchema.partial().extend({
  status: z
    .enum(['AVAILABLE', 'RESERVED', 'RENTED', 'SERVICE', 'RETIRED'])
    .optional(),
  isArchived: z.boolean().optional(),
});

export const VehicleInsuranceSchema = z.object({
  companyName: z.string().min(1).max(200),
  policyNumber: z.string().min(1).max(100),
  expiryDate: z.string().datetime(),
  coverageType: z.enum(['OC', 'AC', 'NNW']),
});

export const VehicleInspectionSchema = z.object({
  expiryDate: z.string().datetime(),
});

export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof UpdateVehicleSchema>;
export type VehicleInsuranceInput = z.infer<typeof VehicleInsuranceSchema>;
export type VehicleInspectionInput = z.infer<typeof VehicleInspectionSchema>;
