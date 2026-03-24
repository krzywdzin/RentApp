import { z } from 'zod';

export const VerifyLicenseSchema = z.object({
  customerId: z.string().uuid(),
  rentalId: z.string().uuid().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  licenseNumber: z.string().min(1),
  requiredCategory: z.string().default('B'),
});
export type VerifyLicenseInput = z.infer<typeof VerifyLicenseSchema>;

export const OverrideCepikSchema = z.object({
  reason: z.string().min(3, 'Podaj powod nadpisania weryfikacji'),
});
export type OverrideCepikInput = z.infer<typeof OverrideCepikSchema>;
