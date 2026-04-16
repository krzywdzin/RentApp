import { z } from 'zod';

export const createContractSchema = z.object({
  rentalId: z.string().uuid(),
  depositAmount: z.number().int().min(0).optional(),
  lateFeeNet: z.number().int().min(0).optional(),
  damageSketchBase64: z.string().optional(),
  rodoConsentAt: z.string().datetime(),
  termsAcceptedAt: z.string().datetime().optional(),
});

export const signContractSchema = z.object({
  signatureType: z.enum([
    'customer_page1',
    'employee_page1',
    'customer_page2',
    'employee_page2',
    'second_customer_page1',
    'second_customer_page2',
  ]),
  signatureBase64: z.string().regex(
    /^(iVBOR|data:image\/png;base64,)/,
    'Must be a base64-encoded PNG',
  ),
  deviceInfo: z.string().optional(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type SignContractInput = z.infer<typeof signContractSchema>;
