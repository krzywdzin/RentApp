import { IsOptional, IsBoolean, IsInt, Min, Max, IsArray } from 'class-validator';

export class UpdateAlertConfigDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  leadTimeDays?: number;

  @IsOptional()
  @IsArray()
  channels?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  maxRepeat?: number | null;
}
