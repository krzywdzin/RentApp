import { IsString, IsOptional, IsIn, IsNotEmpty } from 'class-validator';

export class CreateReturnProtocolDto {
  @IsString()
  @IsNotEmpty()
  rentalId!: string;

  @IsIn(['CZYSTY', 'BRUDNY', 'DO_MYCIA'])
  cleanliness!: string;

  @IsOptional()
  @IsString()
  cleanlinessNote?: string;

  @IsOptional()
  @IsString()
  otherNotes?: string;

  @IsString()
  @IsNotEmpty()
  customerSignatureBase64!: string;

  @IsString()
  @IsNotEmpty()
  workerSignatureBase64!: string;
}
