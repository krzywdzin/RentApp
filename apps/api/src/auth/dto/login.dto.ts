import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(1)
  login!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsUUID()
  deviceId!: string;

  @IsOptional()
  @IsIn(['admin', 'mobile'])
  context?: 'admin' | 'mobile';
}
