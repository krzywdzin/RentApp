import { IsIn, IsString, IsOptional } from 'class-validator';

export class SignContractDto {
  @IsIn(['customer_page1', 'employee_page1', 'customer_page2', 'employee_page2'])
  signatureType!: string;

  @IsString()
  signatureBase64!: string;

  @IsOptional()
  @IsString()
  deviceInfo?: string;
}
