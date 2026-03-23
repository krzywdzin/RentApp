import { IsOptional, IsString } from 'class-validator';

export class SearchCustomerDto {
  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  pesel?: string;
}
