import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CepikService } from './cepik.service';
import { PrismaService } from '../prisma/prisma.service';
import { RentalDriversService } from '../rental-drivers/rental-drivers.service';
import { CepikVerificationStatus, CepikVerificationSource } from '@rentapp/shared';

describe('CepikService', () => {
  let service: CepikService;
  let prisma: Record<string, any>;

  const mockVerification = {
    id: '00000000-0000-4000-a000-000000000001',
    customerId: '00000000-0000-4000-a000-000000000010',
    rentalId: '00000000-0000-4000-a000-000000000020',
    status: CepikVerificationStatus.PASSED,
    result: {
      verified: true,
      licenseValid: true,
      licenseSuspended: false,
      licenseCategories: ['B'],
      categoryMatch: true,
      checkedAt: '2026-03-24T12:00:00.000Z',
      source: CepikVerificationSource.STUB,
    },
    checkedById: '00000000-0000-4000-a000-000000000030',
    overrideReason: null,
    overriddenById: null,
    overriddenAt: null,
    createdAt: new Date('2026-03-24T12:00:00.000Z'),
  };

  beforeEach(async () => {
    prisma = {
      cepikVerification: {
        create: jest.fn().mockResolvedValue(mockVerification),
        findUnique: jest.fn().mockResolvedValue(mockVerification),
        findFirst: jest.fn().mockResolvedValue(mockVerification),
        update: jest.fn().mockResolvedValue({
          ...mockVerification,
          status: CepikVerificationStatus.OVERRIDDEN,
          overrideReason: 'Document verified in person',
          overriddenById: '00000000-0000-4000-a000-000000000040',
          overriddenAt: new Date('2026-03-24T13:00:00.000Z'),
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CepikService,
        { provide: PrismaService, useValue: prisma },
        { provide: RentalDriversService, useValue: {} },
      ],
    }).compile();

    service = module.get<CepikService>(CepikService);
  });

  describe('verifyDriverLicense', () => {
    it('should return PASSED for valid license with matching category', () => {
      const result = service.verifyDriverLicense('Jan', 'Kowalski', 'DRV123', 'B');

      expect(result.verified).toBe(true);
      expect(result.licenseValid).toBe(true);
      expect(result.categoryMatch).toBe(true);
      expect(result.licenseSuspended).toBe(false);
    });

    it('should return categories array with B', () => {
      const result = service.verifyDriverLicense('Jan', 'Kowalski', 'DRV123', 'B');

      expect(result.licenseCategories).toEqual(['B']);
    });

    it('should return FAILED for category mismatch', () => {
      const result = service.verifyDriverLicense('Jan', 'Kowalski', 'DRV123', 'C');

      expect(result.verified).toBe(false);
      expect(result.categoryMatch).toBe(false);
    });

    it('should include source as STUB', () => {
      const result = service.verifyDriverLicense('Jan', 'Kowalski', 'DRV123', 'B');

      expect(result.source).toBe(CepikVerificationSource.STUB);
    });

    it('should set checkedAt to current time', () => {
      const before = new Date().toISOString();
      const result = service.verifyDriverLicense('Jan', 'Kowalski', 'DRV123', 'B');
      const after = new Date().toISOString();

      expect(result.checkedAt >= before).toBe(true);
      expect(result.checkedAt <= after).toBe(true);
    });
  });

  describe('overrideVerification', () => {
    it('should update status to OVERRIDDEN with reason', async () => {
      const adminId = '00000000-0000-4000-a000-000000000040';
      const reason = 'Document verified in person';

      const result = await service.overrideVerification(
        mockVerification.id,
        reason,
        adminId,
      );

      expect(result.status).toBe(CepikVerificationStatus.OVERRIDDEN);
      expect(result.overrideReason).toBe(reason);
      expect(result.overriddenById).toBe(adminId);
      expect(prisma.cepikVerification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockVerification.id },
          data: expect.objectContaining({
            status: CepikVerificationStatus.OVERRIDDEN,
            overrideReason: reason,
            overriddenById: adminId,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return verification when found', async () => {
      const result = await service.findOne(mockVerification.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockVerification.id);
    });

    it('should throw NotFoundException for missing ID', async () => {
      prisma.cepikVerification.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByRental', () => {
    it('should return latest verification for rental', async () => {
      const result = await service.findByRental(mockVerification.rentalId);

      expect(result.rentalId).toBe(mockVerification.rentalId);
      expect(prisma.cepikVerification.findFirst).toHaveBeenCalledWith({
        where: { rentalId: mockVerification.rentalId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should throw NotFoundException when no verification exists', async () => {
      prisma.cepikVerification.findFirst.mockResolvedValue(null);

      await expect(
        service.findByRental('00000000-0000-4000-a000-999999999999'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
