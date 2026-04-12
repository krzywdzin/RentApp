import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRentalDriverDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  pesel!: string;

  @IsString()
  @IsNotEmpty()
  idNumber!: string;

  @IsString()
  @IsNotEmpty()
  licenseNumber!: string;

  @IsOptional()
  @IsString()
  licenseCategory?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  houseNumber?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
