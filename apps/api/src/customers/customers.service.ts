import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  encrypt,
  decrypt,
  hmacIndex,
  EncryptedValue,
} from '../common/crypto/field-encryption';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { SearchCustomerDto } from './dto/search-customer.dto';
import {
  CustomerDto,
  CustomerSearchResultDto,
} from '@rentapp/shared/src/types/customer.types';

const SENSITIVE_FIELDS = ['pesel', 'idNumber', 'licenseNumber'] as const;

// 3.5 years in milliseconds
const RETENTION_PERIOD_MS = 3.5 * 365.25 * 24 * 60 * 60 * 1000;

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCustomerDto): Promise<CustomerDto> {
    const normalizedPesel = dto.pesel.replace(/[\s-]/g, '');

    // Deduplication: check for existing customer by PESEL HMAC
    const existing = await this.prisma.customer.findFirst({
      where: { peselHmac: hmacIndex(normalizedPesel), isArchived: false },
    });
    if (existing) {
      return this.toDto(existing);
    }

    // Encrypt sensitive fields
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

    const retentionExpiresAt = new Date(Date.now() + RETENTION_PERIOD_MS);

    const customer = await this.prisma.customer.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email ?? null,
        address: dto.address ?? null,
        peselEncrypted,
        peselHmac,
        idNumberEncrypted,
        idNumberHmac,
        licenseNumEncrypted,
        licenseNumHmac,
        idIssuedBy: dto.idIssuedBy ?? null,
        idIssuedDate: dto.idIssuedDate
          ? new Date(dto.idIssuedDate)
          : null,
        licenseCategory: dto.licenseCategory ?? null,
        licenseIssuedBy: dto.licenseIssuedBy ?? null,
        retentionExpiresAt,
      },
    });

    return this.toDto(customer);
  }

  async findAll(includeArchived = false): Promise<CustomerDto[]> {
    const where = includeArchived ? {} : { isArchived: false };
    const customers = await this.prisma.customer.findMany({ where });
    return customers.map((c) => this.toDto(c));
  }

  async findOne(id: string): Promise<CustomerDto> {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }
    return this.toDto(customer);
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
  ): Promise<{ oldValues: Record<string, any>; customer: CustomerDto }> {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }

    // Build old values diff for audit
    const oldValues: Record<string, any> = {};
    const data: Record<string, any> = {};

    // Non-sensitive fields
    const plainFields = [
      'firstName',
      'lastName',
      'phone',
      'email',
      'address',
      'idIssuedBy',
      'licenseCategory',
      'licenseIssuedBy',
    ] as const;

    for (const field of plainFields) {
      if (dto[field] !== undefined) {
        oldValues[field] = { old: (existing as any)[field], new: dto[field] };
        data[field] = dto[field];
      }
    }

    if (dto.idIssuedDate !== undefined) {
      oldValues['idIssuedDate'] = {
        old: existing.idIssuedDate?.toISOString() ?? null,
        new: dto.idIssuedDate,
      };
      data['idIssuedDate'] = new Date(dto.idIssuedDate);
    }

    // Sensitive fields -- mask values as "[ENCRYPTED]" in audit
    if (dto.pesel !== undefined) {
      const normalizedPesel = dto.pesel.replace(/[\s-]/g, '');
      data['peselEncrypted'] = encrypt(
        normalizedPesel,
      ) as unknown as Prisma.InputJsonValue;
      data['peselHmac'] = hmacIndex(normalizedPesel);
      oldValues['pesel'] = { old: '[ENCRYPTED]', new: '[ENCRYPTED]' };
    }

    if (dto.idNumber !== undefined) {
      data['idNumberEncrypted'] = encrypt(
        dto.idNumber,
      ) as unknown as Prisma.InputJsonValue;
      data['idNumberHmac'] = hmacIndex(dto.idNumber);
      oldValues['idNumber'] = { old: '[ENCRYPTED]', new: '[ENCRYPTED]' };
    }

    if (dto.licenseNumber !== undefined) {
      data['licenseNumEncrypted'] = encrypt(
        dto.licenseNumber,
      ) as unknown as Prisma.InputJsonValue;
      data['licenseNumHmac'] = hmacIndex(dto.licenseNumber);
      oldValues['licenseNumber'] = { old: '[ENCRYPTED]', new: '[ENCRYPTED]' };
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data,
    });

    return { oldValues, customer: this.toDto(updated) };
  }

  async search(dto: SearchCustomerDto): Promise<CustomerSearchResultDto[]> {
    if (!dto.lastName && !dto.phone && !dto.pesel) {
      throw new BadRequestException('At least one search criterion required');
    }

    const where: any = { isArchived: false };

    if (dto.pesel) {
      where.peselHmac = hmacIndex(dto.pesel.replace(/[\s-]/g, ''));
    }
    if (dto.lastName) {
      where.lastName = { contains: dto.lastName, mode: 'insensitive' };
    }
    if (dto.phone) {
      where.phone = dto.phone;
    }

    const customers = await this.prisma.customer.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
      },
    });

    return customers;
  }

  async archive(id: string): Promise<CustomerDto> {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: { isArchived: true },
    });

    return this.toDto(updated);
  }

  toDto(customer: any): CustomerDto {
    return {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      email: customer.email ?? null,
      address: customer.address ?? null,
      pesel: decrypt(customer.peselEncrypted as unknown as EncryptedValue),
      idNumber: decrypt(
        customer.idNumberEncrypted as unknown as EncryptedValue,
      ),
      licenseNumber: decrypt(
        customer.licenseNumEncrypted as unknown as EncryptedValue,
      ),
      idIssuedBy: customer.idIssuedBy ?? null,
      idIssuedDate: customer.idIssuedDate?.toISOString() ?? null,
      licenseCategory: customer.licenseCategory ?? null,
      licenseIssuedBy: customer.licenseIssuedBy ?? null,
      isArchived: customer.isArchived,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }
}
