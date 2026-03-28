import { z } from 'zod';
import {
  SVG_VIEWS,
  DAMAGE_TYPES,
  SEVERITY_LEVELS,
  WALKTHROUGH_TYPES,
} from '../types/photo.types';

export const damagePinSchema = z.object({
  pinNumber: z.number().int().min(1),
  svgView: z.enum(SVG_VIEWS),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  damageType: z.enum(DAMAGE_TYPES),
  severity: z.enum(SEVERITY_LEVELS),
  note: z.string().max(500).optional(),
  photoKey: z.string().optional(),
  isPreExisting: z.boolean().optional(),
});

export type DamagePinInput = z.infer<typeof damagePinSchema>;

export const createWalkthroughSchema = z.object({
  rentalId: z.string().uuid(),
  type: z.enum(WALKTHROUGH_TYPES),
});

export type CreateWalkthroughInput = z.infer<typeof createWalkthroughSchema>;

export const uploadPhotoSchema = z.object({
  position: z.string().min(1),
  capturedAt: z.string().datetime(),
  gpsLat: z.number().min(-90).max(90).optional(),
  gpsLng: z.number().min(-180).max(180).optional(),
  label: z.string().max(200).optional(),
});

export type UploadPhotoInput = z.infer<typeof uploadPhotoSchema>;

export const createDamageReportSchema = z.object({
  walkthroughId: z.string().uuid(),
  pins: z.array(damagePinSchema).default([]),
  noDamageConfirmed: z.boolean().default(false),
});

export type CreateDamageReportInput = z.infer<typeof createDamageReportSchema>;
