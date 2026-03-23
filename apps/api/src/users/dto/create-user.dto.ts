import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '@rentapp/shared';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}
