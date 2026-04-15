import { IsArray, IsString } from 'class-validator';

export class ParseOcrDto {
  @IsArray()
  @IsString({ each: true })
  texts!: string[];
}
