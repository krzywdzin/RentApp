import { IsOptional, ValidateNested, IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

class AreaInspectionDto {
  @IsString()
  area!: string;

  @IsString()
  condition!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

class HandoverDataDto {
  @IsInt()
  @Min(0)
  mileage!: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AreaInspectionDto)
  areas?: AreaInspectionDto[];

  @IsOptional()
  @IsString()
  generalNotes?: string;
}

export class ActivateRentalDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => HandoverDataDto)
  handoverData?: HandoverDataDto;
}
