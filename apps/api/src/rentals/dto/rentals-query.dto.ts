import { IsOptional, IsInt, IsString, IsBoolean, Min, Max, IsEnum, IsUUID, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { RentalStatus } from '@rentapp/shared';

export class RentalsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(RentalStatus)
  status?: RentalStatus;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsIn(['active', 'archived', 'all'])
  filter?: 'active' | 'archived' | 'all' = 'active';

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasInsurance?: boolean;

  @IsOptional()
  @IsString()
  insuranceSearch?: string;
}
