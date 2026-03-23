import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  deviceId: z.string().uuid(),
});

export const SetupPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export const ResetPasswordRequestSchema = z.object({
  email: z.string().email(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
  deviceId: z.string().uuid(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SetupPasswordInput = z.infer<typeof SetupPasswordSchema>;
export type ResetPasswordRequestInput = z.infer<typeof ResetPasswordRequestSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
