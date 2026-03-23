import { IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
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

class ReturnInspectionDataDto {
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

export class ReturnRentalDto {
  @IsInt()
  @Min(0)
  returnMileage!: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ReturnInspectionDataDto)
  returnData?: ReturnInspectionDataDto;

  @IsOptional()
  @IsString()
  notes?: string;
}
