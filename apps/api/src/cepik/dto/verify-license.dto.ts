import { IsString, IsUUID, IsOptional, MinLength } from 'class-validator';

export class VerifyLicenseDto {
  @IsUUID()
  customerId!: string;

  @IsUUID()
  @IsOptional()
  rentalId?: string;

  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsString()
  @MinLength(1)
  licenseNumber!: string;

  @IsString()
  @IsOptional()
  requiredCategory?: string = 'B';
}
