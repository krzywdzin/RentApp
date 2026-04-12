import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max,
  ValidateNested,
  IsISO8601,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  FuelType,
  TransmissionType,
  InsuranceCoverageType,
} from '@rentapp/shared';
import { IsValidVin } from '../../common/validators/vin.validator';

export class CreateInsuranceDto {
  @IsString()
  companyName!: string;

  @IsString()
  policyNumber!: string;

  @IsISO8601()
  expiryDate!: string;

  @IsEnum(InsuranceCoverageType)
  coverageType!: InsuranceCoverageType;
}

export class CreateInspectionDto {
  @IsISO8601()
  expiryDate!: string;
}

export class CreateVehicleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(15)
  registration!: string;

  @IsString()
  @IsValidVin()
  vin!: string;

  @IsString()
  @MaxLength(100)
  make!: string;

  @IsString()
  @MaxLength(100)
  model!: string;

  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year!: number;

  @IsEnum(FuelType)
  fuelType!: FuelType;

  @IsEnum(TransmissionType)
  transmission!: TransmissionType;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  seatCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  vehicleClassId!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateInsuranceDto)
  insurance?: CreateInsuranceDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateInspectionDto)
  inspection?: CreateInspectionDto;
}
