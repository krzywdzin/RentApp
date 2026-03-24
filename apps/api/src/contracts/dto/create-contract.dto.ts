import {
  IsUUID,
  IsOptional,
  IsInt,
  IsString,
  IsDateString,
  Min,
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
  @IsString()
  damageSketchBase64?: string;

  @IsDateString()
  rodoConsentAt!: string;
}
