import { z } from 'zod';

export const UpdateAlertConfigSchema = z.object({
  enabled: z.boolean().optional(),
  leadTimeDays: z.number().int().min(1).max(90).optional(),
  channels: z.array(z.enum(['SMS', 'EMAIL', 'IN_APP'])).min(1).optional(),
  maxRepeat: z.number().int().min(1).max(30).nullable().optional(),
});

export const NotificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  isRead: z.enum(['true', 'false']).optional(),
});
