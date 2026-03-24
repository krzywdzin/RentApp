import { IsInt, IsNumber, IsString, IsEnum, IsOptional, IsBoolean, Min, Max, MaxLength } from 'class-validator';

export class CreateDamagePinDto {
  @IsInt()
  @Min(1)
  pinNumber!: number;

  @IsEnum(['top', 'front', 'rear', 'left', 'right'])
  svgView!: 'top' | 'front' | 'rear' | 'left' | 'right';

  @IsNumber()
  @Min(0)
  @Max(100)
  x!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  y!: number;

  @IsEnum(['scratch', 'dent', 'crack', 'paint_damage', 'broken_part', 'missing_part', 'other'])
  damageType!: string;

  @IsEnum(['minor', 'moderate', 'severe'])
  severity!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsString()
  photoKey?: string;

  @IsOptional()
  @IsBoolean()
  isPreExisting?: boolean;
}
