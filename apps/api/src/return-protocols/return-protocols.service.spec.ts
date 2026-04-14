import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ReturnProtocolsService } from './return-protocols.service';
import { PdfService } from '../contracts/pdf/pdf.service';
import { MailService } from '../mail/mail.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReturnProtocolDto } from './dto/create-return-protocol.dto';

describe('ReturnProtocolsService', () => {
  let service: ReturnProtocolsService;
  let prisma: { rental: any; returnProtocol: any };
  let pdfService: { generateReturnProtocolPdf: jest.Mock };
  let mailService: { sendReturnProtocolEmail: jest.Mock };
  let storageService: { upload: jest.Mock; getPresignedDownloadUrl: jest.Mock };

  const mockRental = {
    id: 'rental-1',
    status: 'ACTIVE',
    insuranceCaseNumber: null,
    returnLocation: { address: 'Torun, ul. Sieradzka 18', placeId: 'abc' },
    customer: {
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'jan@test.pl',
    },
    vehicle: {
      make: 'Toyota',
      model: 'Corolla',
      registration: 'CT 12345',
    },
  };

  const mockDto: CreateReturnProtocolDto = {
    rentalId: 'rental-1',
    cleanliness: 'CZYSTY',
    customerSignatureBase64: 'iVBORw0KGgoAAAANSUhEUg==',
    workerSignatureBase64: 'iVBORw0KGgoAAAANSUhEUg==',
  };

  const mockProtocol = {
    id: 'protocol-1',
    rentalId: 'rental-1',
    customerName: 'Jan Kowalski',
    returnDateTime: new Date(),
    vehicleMakeModel: 'Toyota Corolla',
    vehicleRegistration: 'CT 12345',
    returnLocation: 'Torun, ul. Sieradzka 18',
    cleanliness: 'CZYSTY',
    cleanlinessNote: null,
    otherNotes: null,
    customerSignatureKey: 'return-protocols/rental-1/customer-signature.png',
    workerSignatureKey: 'return-protocols/rental-1/worker-signature.png',
    pdfKey: 'return-protocols/rental-1/protocol.pdf',
    pdfGeneratedAt: new Date(),
    emailSentAt: null,
    createdById: 'user-1',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      rental: {
        findUnique: jest.fn(),
      },
      returnProtocol: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    pdfService = {
      generateReturnProtocolPdf: jest.fn().mockResolvedValue(Buffer.from('pdf-content')),
    };

    mailService = {
      sendReturnProtocolEmail: jest.fn().mockResolvedValue(undefined),
    };

    storageService = {
      upload: jest.fn().mockResolvedValue('key'),
      getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://signed-url.example.com'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReturnProtocolsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PdfService, useValue: pdfService },
        { provide: MailService, useValue: mailService },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    service = module.get<ReturnProtocolsService>(ReturnProtocolsService);
  });

  describe('create', () => {
    it('should upload signatures, create protocol record, and generate PDF', async () => {
      prisma.rental.findUnique.mockResolvedValue(mockRental);
      prisma.returnProtocol.findUnique.mockResolvedValue(null);
      prisma.returnProtocol.create.mockResolvedValue(mockProtocol);

      const result = await service.create(mockDto, 'user-1');

      // Should upload 2 signatures + 1 PDF = 3 uploads
      expect(storageService.upload).toHaveBeenCalledTimes(3);
      expect(storageService.upload).toHaveBeenCalledWith(
        'return-protocols/rental-1/customer-signature.png',
        expect.any(Buffer),
        'image/png',
      );
      expect(storageService.upload).toHaveBeenCalledWith(
        'return-protocols/rental-1/worker-signature.png',
        expect.any(Buffer),
        'image/png',
      );
      expect(prisma.returnProtocol.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should generate PDF via PdfService.generateReturnProtocolPdf()', async () => {
      prisma.rental.findUnique.mockResolvedValue(mockRental);
      prisma.returnProtocol.findUnique.mockResolvedValue(null);
      prisma.returnProtocol.create.mockResolvedValue(mockProtocol);

      await service.create(mockDto, 'user-1');

      expect(pdfService.generateReturnProtocolPdf).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'Jan Kowalski',
          vehicleMakeModel: 'Toyota Corolla',
          vehicleRegistration: 'CT 12345',
          cleanlinessLabel: 'Czysty',
        }),
      );
    });

    it('should send email via MailService.sendReturnProtocolEmail() fire-and-forget', async () => {
      // Capture setImmediate callback
      const originalSetImmediate = global.setImmediate;
      const callbacks: Array<() => void> = [];
      jest.spyOn(global, 'setImmediate').mockImplementation((cb: any) => {
        callbacks.push(cb);
        return {} as NodeJS.Immediate;
      });

      prisma.rental.findUnique.mockResolvedValue(mockRental);
      prisma.returnProtocol.findUnique.mockResolvedValue(null);
      prisma.returnProtocol.create.mockResolvedValue(mockProtocol);

      await service.create(mockDto, 'user-1');

      // Execute captured setImmediate callbacks
      expect(callbacks).toHaveLength(1);
      callbacks[0]();
      // Allow promises to resolve
      await new Promise((resolve) => originalSetImmediate(resolve));

      expect(mailService.sendReturnProtocolEmail).toHaveBeenCalledWith(
        'jan@test.pl',
        'Jan Kowalski',
        'CT 12345',
        expect.any(Buffer),
        null,
      );

      (global.setImmediate as any).mockRestore();
    });

    it('should throw BadRequestException if rental not found', async () => {
      prisma.rental.findUnique.mockResolvedValue(null);

      await expect(service.create(mockDto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if rental is not ACTIVE', async () => {
      prisma.rental.findUnique.mockResolvedValue({
        ...mockRental,
        status: 'RETURNED',
      });

      await expect(service.create(mockDto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if protocol already exists for rental', async () => {
      prisma.rental.findUnique.mockResolvedValue(mockRental);
      prisma.returnProtocol.findUnique.mockResolvedValue(mockProtocol);

      await expect(service.create(mockDto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getDownloadUrl', () => {
    it('should return presigned URL for stored PDF', async () => {
      prisma.returnProtocol.findUnique.mockResolvedValue(mockProtocol);

      const result = await service.getDownloadUrl('rental-1');

      expect(storageService.getPresignedDownloadUrl).toHaveBeenCalledWith(
        'return-protocols/rental-1/protocol.pdf',
      );
      expect(result).toBe('https://signed-url.example.com');
    });

    it('should throw NotFoundException if protocol not found', async () => {
      prisma.returnProtocol.findUnique.mockResolvedValue(null);

      await expect(service.getDownloadUrl('rental-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByRentalId', () => {
    it('should return protocol or null', async () => {
      prisma.returnProtocol.findUnique.mockResolvedValue(mockProtocol);

      const result = await service.findByRentalId('rental-1');
      expect(result).toEqual(mockProtocol);

      prisma.returnProtocol.findUnique.mockResolvedValue(null);
      const nullResult = await service.findByRentalId('rental-2');
      expect(nullResult).toBeNull();
    });
  });
});
