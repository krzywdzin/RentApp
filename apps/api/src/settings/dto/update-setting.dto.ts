import { IsString, MaxLength } from 'class-validator';

export class UpdateSettingDto {
  @IsString()
  @MaxLength(100000)
  value!: string;
}
