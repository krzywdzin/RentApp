import { z } from 'zod';
import { isValidNip } from '../lib/nip';

export const PlaceLocationSchema = z.object({
  address: z.string().min(1).max(500),
  placeId: z.string().min(1).max(300),
});

const ConditionRatingSchema = z.enum(['good', 'minor_damage', 'major_damage', 'missing']);

const InspectionAreaSchema = z.enum([
  'front',
  'rear',
  'left',
  'right',
  'roof',
  'interior',
  'trunk',
  'engine',
]);

const AreaInspectionSchema = z.object({
  area: InspectionAreaSchema,
  condition: ConditionRatingSchema,
  note: z.string().max(500).optional(),
});

export const RentalVehicleInspectionSchema = z.object({
  mileage: z.number().int().min(0),
  areas: z.array(AreaInspectionSchema).optional(),
  generalNotes: z.string().max(2000).optional(),
});

export const CreateRentalSchema = z
  .object({
    vehicleId: z.string().uuid(),
    customerId: z.string().uuid(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    dailyRateNet: z.number().int().min(0).optional(),
    totalPriceNet: z.number().int().min(0).optional(),
    vatRate: z.number().int().min(0).max(100).default(23),
    notes: z.string().max(2000).nullable().optional(),
    status: z.enum(['DRAFT', 'ACTIVE']).default('DRAFT'),
    handoverData: RentalVehicleInspectionSchema.optional(),
    overrideConflict: z.boolean().default(false),
    isCompanyRental: z.boolean().default(false),
    companyNip: z.string().length(10).nullable().optional(),
    vatPayerStatus: z.enum(['FULL_100', 'HALF_50', 'NONE']).nullable().optional(),
    insuranceCaseNumber: z.string().max(100).nullable().optional(),
    pickupLocation: PlaceLocationSchema.nullable().optional(),
    returnLocation: PlaceLocationSchema.nullable().optional(),
    dailyKmLimit: z.number().int().min(0).nullable().optional(),
    excessKmRate: z.number().int().min(0).nullable().optional(),
    deposit: z.number().int().min(0).nullable().optional(),
    returnDeadlineHour: z.string().max(5).nullable().optional(),
    lateReturnPenalty: z.number().int().min(0).nullable().optional(),
    fuelLevelRequired: z.enum(['FULL', 'SAME_AS_PICKUP', 'ANY']).nullable().optional(),
    fuelCharge: z.number().int().min(0).nullable().optional(),
    crossBorderAllowed: z.boolean().default(false),
    dirtyReturnFee: z.number().int().min(0).nullable().optional(),
    deductible: z.number().int().min(0).nullable().optional(),
    deductibleWaiverFee: z.number().int().min(0).nullable().optional(),
  })
  .refine((data) => data.dailyRateNet != null || data.totalPriceNet != null, {
    message: 'Either dailyRateNet or totalPriceNet must be provided',
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'endDate must be after startDate',
  })
  .refine((data) => !data.isCompanyRental || (data.companyNip && data.companyNip.length === 10), {
    message: 'NIP jest wymagany dla wynajmu firmowego',
    path: ['companyNip'],
  })
  .refine((data) => !data.companyNip || isValidNip(data.companyNip), {
    message: 'Nieprawidlowy NIP',
    path: ['companyNip'],
  });

export const ExtendRentalSchema = z.object({
  newEndDate: z.string().datetime(),
  totalPriceNet: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

export const ReturnRentalSchema = z.object({
  returnMileage: z.number().int().min(0),
  returnData: RentalVehicleInspectionSchema.optional(),
  notes: z.string().max(2000).optional(),
});

export const CalendarQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export type CreateRentalInput = z.infer<typeof CreateRentalSchema>;
export type ExtendRentalInput = z.infer<typeof ExtendRentalSchema>;
export type ReturnRentalInput = z.infer<typeof ReturnRentalSchema>;
export type CalendarQueryInput = z.infer<typeof CalendarQuerySchema>;
