import {
  IsString,
  MinLength,
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
  address?: string;

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
}
