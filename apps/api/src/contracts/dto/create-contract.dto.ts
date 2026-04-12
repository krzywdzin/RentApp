import {
  IsUUID,
  IsOptional,
  IsInt,
  IsString,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateContractDto {
  @IsUUID()
  rentalId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lateFeeNet?: number;

  @IsOptional()
  @MaxLength(500000)
  @IsString()
  damageSketchBase64?: string;

  @IsDateString()
  rodoConsentAt!: string;

  @IsOptional()
  @IsDateString()
  termsAcceptedAt?: string;
}
