import { z } from 'zod';

export const CreateCustomerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(5).max(20),
  email: z.string().email().nullable().optional(),
  street: z.string().max(200).nullable().optional(),
  houseNumber: z.string().max(20).nullable().optional(),
  apartmentNumber: z.string().max(20).nullable().optional(),
  postalCode: z.string().regex(/^\d{2}-\d{3}$/, 'Format: XX-XXX').nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  pesel: z
    .string()
    .length(11)
    .regex(/^\d{11}$/, 'PESEL must be 11 digits'),
  idNumber: z.string().min(3).max(20),
  licenseNumber: z.string().min(3).max(30),
  idIssuedBy: z.string().max(200).nullable().optional(),
  idIssuedDate: z.string().nullable().optional(),
  idExpiryDate: z.string().nullable().optional(),
  licenseCategory: z.string().max(20).nullable().optional(),
  licenseIssuedBy: z.string().max(200).nullable().optional(),
  licenseIssuedDate: z.string().nullable().optional(),
  licenseBookletNumber: z.string().max(50).nullable().optional(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

export const SearchCustomerSchema = z.object({
  query: z.string().min(1).max(200),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
export type SearchCustomerInput = z.infer<typeof SearchCustomerSchema>;
