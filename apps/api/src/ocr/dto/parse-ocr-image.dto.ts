import { IsString, IsNotEmpty } from 'class-validator';

export class ParseOcrImageDto {
  @IsString()
  @IsNotEmpty()
  imageBase64!: string;
}
