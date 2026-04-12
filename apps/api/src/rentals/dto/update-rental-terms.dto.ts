import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateRentalTermsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100000)
  rentalTerms?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  termsNotes?: string;
}
