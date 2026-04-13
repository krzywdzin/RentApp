import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class AutocompleteQueryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  input!: string;

  @IsOptional()
  @IsString()
  sessiontoken?: string;
}
