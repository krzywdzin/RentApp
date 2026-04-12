import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RentalDriver } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  encrypt,
  decrypt,
  hmacIndex,
  EncryptedValue,
} from '../common/crypto/field-encryption';
import { CreateRentalDriverDto } from './dto/create-rental-driver.dto';

export interface RentalDriverDto {
  id: string;
  rentalId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  pesel: string;
  idNumber: string;
  licenseNumber: string;
  licenseCategory: string | null;
  street: string | null;
  houseNumber: string | null;
  postalCode: string | null;
  city: string | null;
  createdAt: string;
}

@Injectable()
export class RentalDriversService {
  constructor(private prisma: PrismaService) {}

  async create(
    rentalId: string,
    dto: CreateRentalDriverDto,
  ): Promise<RentalDriverDto> {
    const normalizedPesel = dto.pesel.replace(/[\s-]/g, '');

    const peselEncrypted = encrypt(
      normalizedPesel,
    ) as unknown as Prisma.InputJsonValue;
    const peselHmac = hmacIndex(normalizedPesel);
    const idNumberEncrypted = encrypt(
      dto.idNumber,
    ) as unknown as Prisma.InputJsonValue;
    const idNumberHmac = hmacIndex(dto.idNumber);
    const licenseNumEncrypted = encrypt(
      dto.licenseNumber,
    ) as unknown as Prisma.InputJsonValue;
    const licenseNumHmac = hmacIndex(dto.licenseNumber);

    const driver = await this.prisma.rentalDriver.create({
      data: {
        rentalId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone ?? null,
        peselEncrypted,
        peselHmac,
        idNumberEncrypted,
        idNumberHmac,
        licenseNumEncrypted,
        licenseNumHmac,
        licenseCategory: dto.licenseCategory ?? null,
        street: dto.street ?? null,
        houseNumber: dto.houseNumber ?? null,
        postalCode: dto.postalCode ?? null,
        city: dto.city ?? null,
      },
    });

    return this.toDto(driver);
  }

  async findByRentalId(rentalId: string): Promise<RentalDriverDto | null> {
    const driver = await this.prisma.rentalDriver.findUnique({
      where: { rentalId },
    });
    if (!driver) return null;
    return this.toDto(driver);
  }

  async delete(rentalId: string): Promise<void> {
    const driver = await this.prisma.rentalDriver.findUnique({
      where: { rentalId },
    });
    if (!driver) {
      throw new NotFoundException(
        `No additional driver found for rental ${rentalId}`,
      );
    }
    await this.prisma.rentalDriver.delete({
      where: { rentalId },
    });
  }

  private toDto(driver: RentalDriver): RentalDriverDto {
    return {
      id: driver.id,
      rentalId: driver.rentalId,
      firstName: driver.firstName,
      lastName: driver.lastName,
      phone: driver.phone,
      pesel: decrypt(driver.peselEncrypted as unknown as EncryptedValue),
      idNumber: decrypt(driver.idNumberEncrypted as unknown as EncryptedValue),
      licenseNumber: decrypt(
        driver.licenseNumEncrypted as unknown as EncryptedValue,
      ),
      licenseCategory: driver.licenseCategory,
      street: driver.street,
      houseNumber: driver.houseNumber,
      postalCode: driver.postalCode,
      city: driver.city,
      createdAt: driver.createdAt.toISOString(),
    };
  }
}
