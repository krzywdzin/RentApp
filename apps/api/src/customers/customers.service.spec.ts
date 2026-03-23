import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PrismaService } from '../prisma/prisma.service';
import * as fieldEncryption from '../common/crypto/field-encryption';

// Mock field-encryption module
jest.mock('../common/crypto/field-encryption', () => ({
  encrypt: jest.fn((value: string) => ({
    ciphertext: `enc_${value}`,
    iv: 'mock_iv',
    tag: 'mock_tag',
  })),
  decrypt: jest.fn((encrypted: any) => {
    const ct = encrypted.ciphertext as string;
    return ct.startsWith('enc_') ? ct.slice(4) : ct;
  }),
  hmacIndex: jest.fn((value: string) => `hmac_${value}`),
}));

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: {
    customer: {
      findFirst: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockCustomer = {
    id: 'cust-1',
    firstName: 'Jan',
    lastName: 'Kowalski',
    phone: '+48123456789',
    email: 'jan@test.com',
    address: 'ul. Testowa 1',
    peselEncrypted: { ciphertext: 'enc_44051401358', iv: 'mock_iv', tag: 'mock_tag' },
    peselHmac: 'hmac_44051401358',
    idNumberEncrypted: { ciphertext: 'enc_ABC123456', iv: 'mock_iv', tag: 'mock_tag' },
    idNumberHmac: 'hmac_ABC123456',
    licenseNumEncrypted: { ciphertext: 'enc_DRV789012', iv: 'mock_iv', tag: 'mock_tag' },
    licenseNumHmac: 'hmac_DRV789012',
    idIssuedBy: 'Urzad Miasta',
    idIssuedDate: new Date('2020-01-15'),
    licenseCategory: 'B',
    licenseIssuedBy: 'Starostwo',
    retentionExpiresAt: new Date(Date.now() + 3.5 * 365.25 * 24 * 60 * 60 * 1000),
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      customer: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create()', () => {
    const createDto = {
      firstName: 'Jan',
      lastName: 'Kowalski',
      phone: '+48123456789',
      email: 'jan@test.com',
      pesel: '44051401358',
      idNumber: 'ABC123456',
      licenseNumber: 'DRV789012',
    };

    it('calls encrypt() for pesel, idNumber, and licenseNumber', async () => {
      prisma.customer.findFirst.mockResolvedValue(null);
      prisma.customer.create.mockResolvedValue(mockCustomer);

      await service.create(createDto);

      expect(fieldEncryption.encrypt).toHaveBeenCalledWith('44051401358');
      expect(fieldEncryption.encrypt).toHaveBeenCalledWith('ABC123456');
      expect(fieldEncryption.encrypt).toHaveBeenCalledWith('DRV789012');
    });

    it('calls hmacIndex() for pesel, idNumber, and licenseNumber', async () => {
      prisma.customer.findFirst.mockResolvedValue(null);
      prisma.customer.create.mockResolvedValue(mockCustomer);

      await service.create(createDto);

      expect(fieldEncryption.hmacIndex).toHaveBeenCalledWith('44051401358');
      expect(fieldEncryption.hmacIndex).toHaveBeenCalledWith('ABC123456');
      expect(fieldEncryption.hmacIndex).toHaveBeenCalledWith('DRV789012');
    });

    it('returns existing customer when PESEL HMAC already exists (deduplication)', async () => {
      prisma.customer.findFirst.mockResolvedValue(mockCustomer);

      const result = await service.create(createDto);

      expect(prisma.customer.create).not.toHaveBeenCalled();
      expect(result.id).toBe('cust-1');
      expect(result.firstName).toBe('Jan');
    });

    it('sets retentionExpiresAt approximately 3.5 years from now', async () => {
      prisma.customer.findFirst.mockResolvedValue(null);
      prisma.customer.create.mockImplementation(async ({ data }) => ({
        ...mockCustomer,
        retentionExpiresAt: data.retentionExpiresAt,
      }));

      await service.create(createDto);

      const createCall = prisma.customer.create.mock.calls[0][0];
      const retention = createCall.data.retentionExpiresAt as Date;
      const threeAndHalfYearsMs = 3.5 * 365.25 * 24 * 60 * 60 * 1000;
      const diff = retention.getTime() - Date.now();
      // Allow 10 seconds tolerance
      expect(Math.abs(diff - threeAndHalfYearsMs)).toBeLessThan(10000);
    });
  });

  describe('findOne()', () => {
    it('calls decrypt() for sensitive fields', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);

      const result = await service.findOne('cust-1');

      expect(fieldEncryption.decrypt).toHaveBeenCalledWith(mockCustomer.peselEncrypted);
      expect(fieldEncryption.decrypt).toHaveBeenCalledWith(mockCustomer.idNumberEncrypted);
      expect(fieldEncryption.decrypt).toHaveBeenCalledWith(mockCustomer.licenseNumEncrypted);
      expect(result.pesel).toBe('44051401358');
      expect(result.idNumber).toBe('ABC123456');
      expect(result.licenseNumber).toBe('DRV789012');
    });

    it('throws NotFoundException when customer not found', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('search()', () => {
    it('uses hmacIndex to build where clause when searching by pesel', async () => {
      prisma.customer.findMany.mockResolvedValue([]);

      await service.search({ pesel: '44051401358' });

      expect(fieldEncryption.hmacIndex).toHaveBeenCalledWith('44051401358');
      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            peselHmac: 'hmac_44051401358',
            isArchived: false,
          }),
        }),
      );
    });

    it('uses case-insensitive contains when searching by lastName', async () => {
      prisma.customer.findMany.mockResolvedValue([]);

      await service.search({ lastName: 'Kowalski' });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            lastName: { contains: 'Kowalski', mode: 'insensitive' },
            isArchived: false,
          }),
        }),
      );
    });

    it('throws BadRequestException with no criteria', async () => {
      await expect(service.search({})).rejects.toThrow(BadRequestException);
    });
  });

  describe('update()', () => {
    it('masks sensitive field values as "[ENCRYPTED]" in oldValues', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.customer.update.mockResolvedValue(mockCustomer);

      const { oldValues } = await service.update('cust-1', {
        pesel: '44051401358',
        idNumber: 'NEW123',
        licenseNumber: 'NEWDRV456',
      });

      expect(oldValues.pesel).toEqual({ old: '[ENCRYPTED]', new: '[ENCRYPTED]' });
      expect(oldValues.idNumber).toEqual({ old: '[ENCRYPTED]', new: '[ENCRYPTED]' });
      expect(oldValues.licenseNumber).toEqual({ old: '[ENCRYPTED]', new: '[ENCRYPTED]' });
    });
  });

  describe('archive()', () => {
    it('sets isArchived to true', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.customer.update.mockResolvedValue({
        ...mockCustomer,
        isArchived: true,
      });

      const result = await service.archive('cust-1');

      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'cust-1' },
        data: { isArchived: true },
      });
      expect(result.isArchived).toBe(true);
    });
  });
});
