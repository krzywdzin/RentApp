import { z } from 'zod';

export const PortalTokenExchangeSchema = z.object({
  token: z.string().min(1),
  customerId: z.string().uuid(),
});
export type PortalTokenExchangeInput = z.infer<
  typeof PortalTokenExchangeSchema
>;
