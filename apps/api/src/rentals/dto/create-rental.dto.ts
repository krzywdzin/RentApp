import {
  IsString,
  IsUUID,
  IsISO8601,
  IsOptional,
  IsInt,
  IsEnum,
  IsBoolean,
  Min,
  MinLength,
  MaxLength,
  ValidateNested,
  ValidateIf,
  IsNumber,
  Validate,
} from 'class-validator';
import { DateAfterValidator } from '../../common/validators/date-after.validator';
import { IsValidNip } from '../../common/validators/nip.validator';
import { Type } from 'class-transformer';
import { RentalStatus, VatPayerStatus, FuelLevelRequired } from '@rentapp/shared';

class PlaceLocationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  address!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  placeId!: string;
}

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

export class CreateRentalDto {
  @IsUUID()
  vehicleId!: string;

  @IsUUID()
  customerId!: string;

  @IsISO8601()
  startDate!: string;

  @IsISO8601()
  @Validate(DateAfterValidator, ['startDate'])
  endDate!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  dailyRateNet?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalPriceNet?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  vatRate?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(RentalStatus)
  @ValidateIf((o) => o.status === RentalStatus.DRAFT || o.status === RentalStatus.ACTIVE)
  status?: RentalStatus.DRAFT | RentalStatus.ACTIVE;

  @IsOptional()
  @ValidateNested()
  @Type(() => HandoverDataDto)
  handoverData?: HandoverDataDto;

  @IsOptional()
  @IsBoolean()
  overrideConflict?: boolean;

  @IsOptional()
  @IsBoolean()
  isCompanyRental?: boolean;

  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.isCompanyRental === true)
  @IsValidNip({ message: 'Nieprawidlowy NIP' })
  companyNip?: string;

  @IsOptional()
  @IsEnum(VatPayerStatus)
  @ValidateIf((o) => o.isCompanyRental === true)
  vatPayerStatus?: VatPayerStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  insuranceCaseNumber?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PlaceLocationDto)
  pickupLocation?: PlaceLocationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PlaceLocationDto)
  returnLocation?: PlaceLocationDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  dailyKmLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  excessKmRate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  deposit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  returnDeadlineHour?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  lateReturnPenalty?: number;

  @IsOptional()
  @IsEnum(FuelLevelRequired)
  fuelLevelRequired?: FuelLevelRequired;

  @IsOptional()
  @IsInt()
  @Min(0)
  fuelCharge?: number;

  @IsOptional()
  @IsBoolean()
  crossBorderAllowed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  dirtyReturnFee?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  deductible?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  deductibleWaiverFee?: number;
}
