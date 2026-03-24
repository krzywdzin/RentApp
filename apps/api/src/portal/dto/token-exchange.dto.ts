import { IsString, IsUUID, MinLength } from 'class-validator';

export class TokenExchangeDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsUUID()
  customerId!: string;
}
