import { IsISO8601, IsOptional, IsInt, IsString, Min } from 'class-validator';

export class ExtendRentalDto {
  @IsISO8601()
  newEndDate!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalPriceNet?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
