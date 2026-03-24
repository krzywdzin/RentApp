import { IsDateString, IsOptional, IsInt } from 'class-validator';

export class CreateAnnexDto {
  @IsDateString()
  newEndDate!: string;

  @IsOptional()
  @IsInt()
  newDailyRateNet?: number;

  @IsOptional()
  @IsInt()
  newTotalPriceNet?: number;
}
