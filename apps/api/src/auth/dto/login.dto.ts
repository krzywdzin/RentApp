import { IsIn, IsOptional, IsString, IsUUID, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(1)
  login!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character',
  })
  password!: string;

  @IsUUID()
  deviceId!: string;

  @IsOptional()
  @IsIn(['admin', 'mobile'])
  context?: 'admin' | 'mobile';
}
