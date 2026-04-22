import { IsIn, IsString, IsOptional, MaxLength } from 'class-validator';

export class SignContractDto {
  @IsIn(['customer_page1', 'employee_page1', 'customer_page2', 'employee_page2', 'second_customer_page1', 'second_customer_page2'])
  signatureType!: string;

  @MaxLength(5_000_000)
  @IsString()
  signatureBase64!: string;

  @IsOptional()
  @IsString()
  deviceInfo?: string;
}
