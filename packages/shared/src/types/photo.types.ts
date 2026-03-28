export const PHOTO_POSITIONS = [
  'front', 'rear', 'left_side', 'right_side',
  'interior_front', 'interior_rear', 'dashboard', 'trunk',
] as const;
export type PhotoPosition = typeof PHOTO_POSITIONS[number];

export const WALKTHROUGH_TYPES = ['HANDOVER', 'RETURN'] as const;
export type WalkthroughType = typeof WALKTHROUGH_TYPES[number];

export const DAMAGE_TYPES = [
  'scratch', 'dent', 'crack', 'paint_damage',
  'broken_part', 'missing_part', 'other',
] as const;
export type DamageType = typeof DAMAGE_TYPES[number];

export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  scratch: 'Rysa',
  dent: 'Wgniecenie',
  crack: 'Pekniecie',
  paint_damage: 'Uszkodzenie lakieru',
  broken_part: 'Uszkodzony element',
  missing_part: 'Brakujacy element',
  other: 'Inne',
};

export const SEVERITY_LEVELS = ['minor', 'moderate', 'severe'] as const;
export type SeverityLevel = typeof SEVERITY_LEVELS[number];

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  minor: 'Drobne',
  moderate: 'Umiarkowane',
  severe: 'Powazne',
};

export const SVG_VIEWS = ['top', 'front', 'rear', 'left', 'right'] as const;
export type SvgView = typeof SVG_VIEWS[number];

export interface DamagePin {
  pinNumber: number;
  svgView: SvgView;
  x: number;
  y: number;
  damageType: DamageType;
  severity: SeverityLevel;
  note?: string;
  photoKey?: string;
  isPreExisting?: boolean;
}

export interface PhotoComparisonPair {
  position: PhotoPosition | string;
  handover: { photoUrl: string; thumbnailUrl: string } | null;
  return: { photoUrl: string; thumbnailUrl: string } | null;
}

export interface DamageComparisonResult {
  handoverPins: DamagePin[];
  returnPins: DamagePin[];
  newPins: DamagePin[];
}

// Re-export schemas from their new canonical location for backward compatibility
export {
  damagePinSchema,
  createWalkthroughSchema,
  uploadPhotoSchema,
  createDamageReportSchema,
} from '../schemas/photo.schemas';
