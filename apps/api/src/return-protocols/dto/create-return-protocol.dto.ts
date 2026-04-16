import { IsString, IsOptional, IsIn, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';

export class CreateReturnProtocolDto {
  @IsUUID()
  rentalId!: string;

  @IsIn(['CZYSTY', 'BRUDNY', 'DO_MYCIA'])
  cleanliness!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  cleanlinessNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  otherNotes?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500000)
  customerSignatureBase64!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500000)
  workerSignatureBase64!: string;
}
