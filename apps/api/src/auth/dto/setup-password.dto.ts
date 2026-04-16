import { IsString, Matches, MinLength } from 'class-validator';

export class SetupPasswordDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character',
  })
  password!: string;
}
