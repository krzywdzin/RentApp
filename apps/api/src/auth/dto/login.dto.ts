import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(1)
  login!: string;

  // Login must accept any existing password; complexity rules belong only to setup/reset/change password flows.
  @IsString()
  @MinLength(1)
  password!: string;

  // Mobile/web clients may send legacy or non-UUID device ids; do not block login on format.
  @IsString()
  @MinLength(1)
  deviceId!: string;

  @IsOptional()
  @IsIn(['admin', 'mobile'])
  context?: 'admin' | 'mobile';
}
