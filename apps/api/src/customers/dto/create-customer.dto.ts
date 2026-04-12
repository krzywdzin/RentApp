import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsEmail,
  IsISO8601,
} from 'class-validator';
import { IsValidPesel } from '../../common/validators/pesel.validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsString()
  @MinLength(5)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  houseNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  apartmentNumber?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}-\d{3}$/, { message: 'Format: XX-XXX' })
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsValidPesel()
  pesel!: string;

  @IsString()
  @MinLength(3)
  idNumber!: string;

  @IsString()
  @MinLength(3)
  licenseNumber!: string;

  @IsOptional()
  @IsString()
  idIssuedBy?: string;

  @IsOptional()
  @IsISO8601()
  idIssuedDate?: string;

  @IsOptional()
  @IsString()
  licenseCategory?: string;

  @IsOptional()
  @IsString()
  licenseIssuedBy?: string;

  @IsOptional()
  @IsISO8601()
  licenseIssuedDate?: string;

  @IsOptional()
  @IsISO8601()
  idExpiryDate?: string;

  @IsOptional()
  @IsString()
  licenseBookletNumber?: string;
}
