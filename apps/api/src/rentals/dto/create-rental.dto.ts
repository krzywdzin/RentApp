import {
  IsString,
  IsUUID,
  IsISO8601,
  IsOptional,
  IsInt,
  IsEnum,
  IsBoolean,
  Min,
  MaxLength,
  ValidateNested,
  ValidateIf,
  IsNumber,
  Validate,
} from 'class-validator';
import { DateAfterValidator } from '../../common/validators/date-after.validator';
import { IsValidNip } from '../../common/validators/nip.validator';
import { Type } from 'class-transformer';
import { RentalStatus, VatPayerStatus } from '@rentapp/shared';

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
}
