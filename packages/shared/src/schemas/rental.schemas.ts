import { z } from 'zod';

const ConditionRatingSchema = z.enum(['good', 'minor_damage', 'major_damage', 'missing']);

const InspectionAreaSchema = z.enum([
  'front', 'rear', 'left', 'right',
  'roof', 'interior', 'trunk', 'engine',
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
  })
  .refine((data) => data.dailyRateNet != null || data.totalPriceNet != null, {
    message: 'Either dailyRateNet or totalPriceNet must be provided',
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'endDate must be after startDate',
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
