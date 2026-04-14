import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { PdfService } from './pdf/pdf.service';
import { PdfEncryptionService } from './pdf/pdf-encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { MailService } from '../mail/mail.service';
import { CustomersService } from '../customers/customers.service';
import { PortalService } from '../portal/portal.service';
import { SettingsService } from '../settings/settings.service';
import { RentalDriversService } from '../rental-drivers/rental-drivers.service';
import { SmsService } from '../notifications/sms/sms.service';
import { ContractStatus } from '@rentapp/shared';
import type { ContractFrozenData } from '@rentapp/shared';

describe('ContractsService', () => {
  let service: ContractsService;
  let prisma: any;
  let pdfService: any;
  let storageService: any;
  let mailService: any;
  let customersService: any;
  let pdfEncryptionService: any;
  let smsService: any;

  const mockRental = {
    id: 'rental-1',
    customerId: 'customer-1',
    vehicleId: 'vehicle-1',
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-03-10'),
    dailyRateNet: 10000,
    totalPriceNet: 90000,
    totalPriceGross: 110700,
    vatRate: 23,
    vehicle: {
      id: 'vehicle-1',
      registration: 'TO 12345',
      make: 'Toyota',
      model: 'Corolla',
      year: 2022,
      vin: 'VIN123456789',
      mileage: 50000,
    },
    customer: { id: 'customer-1' },
  };

  const mockCustomerDto = {
    id: 'customer-1',
    firstName: 'Jan',
    lastName: 'Kowalski',
    phone: '+48123456789',
    email: 'jan@example.com',
    address: 'ul. Testowa 1',
    pesel: '44051401359',
    idNumber: 'ABC123456',
    idIssuedBy: 'Urzad Miasta',
    licenseNumber: 'DRV789012',
    licenseCategory: 'B',
  };

  const mockContract = {
    id: 'contract-1',
    contractNumber: 'KITEK/2026/0324/0001',
    rentalId: 'rental-1',
    createdById: 'user-1',
    status: 'DRAFT',
    contractData: {
      company: { name: 'KITEK', owner: 'Pawel Romanowski', address: 'ul. Sieradzka 18, 87-100 Torun', phone: '535 766 666 / 602 367 100' },
      customer: { firstName: 'Jan', lastName: 'Kowalski', address: 'ul. Testowa 1', pesel: '44051401359', idNumber: 'ABC123456', idIssuedBy: 'Urzad Miasta', licenseNumber: 'DRV789012', licenseCategory: 'B', phone: '+48123456789', email: 'jan@example.com' },
      vehicle: { registration: 'TO 12345', make: 'Toyota', model: 'Corolla', year: 2022, vin: 'VIN123456789', mileage: 50000 },
      rental: { startDate: '2026-03-01T00:00:00.000Z', endDate: '2026-03-10T00:00:00.000Z', dailyRateNet: 10000, totalPriceNet: 90000, totalPriceGross: 110700, vatRate: 23 },
      conditions: { depositAmount: 50000, dailyRateNet: 10000, lateFeeNet: 5000 },
    } as ContractFrozenData,
    contentHash: '',
    depositAmount: 50000,
    dailyRateNet: 10000,
    lateFeeNet: 5000,
    rodoConsentAt: new Date('2026-03-24T10:00:00Z'),
    damageSketchKey: null,
    pdfKey: null,
    pdfGeneratedAt: null,
    emailSentAt: null,
    emailSentTo: null,
    signatures: [],
    annexes: [],
    createdAt: new Date('2026-03-24T10:00:00Z'),
    updatedAt: new Date('2026-03-24T10:00:00Z'),
  };

  beforeEach(async () => {
    prisma = {
      rental: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      vehicle: {
        update: jest.fn().mockResolvedValue({}),
      },
      contract: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      contractSignature: {
        upsert: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
      },
      contractAnnex: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn(async (fn: (tx: any) => Promise<any>) => {
        // Pass a tx object that mirrors prisma's contract methods
        return fn(prisma);
      }),
    };

    pdfService = {
      generateContractPdf: jest.fn().mockResolvedValue(Buffer.from('pdf-data')),
      generateAnnexPdf: jest.fn().mockResolvedValue(Buffer.from('annex-pdf')),
    };

    storageService = {
      upload: jest.fn().mockResolvedValue('key'),
      getBuffer: jest.fn().mockResolvedValue(Buffer.from('sig-data')),
      getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://presigned-url'),
    };

    mailService = {
      sendContractEmail: jest.fn().mockResolvedValue(undefined),
      sendAnnexEmail: jest.fn().mockResolvedValue(undefined),
    };

    customersService = {
      findOne: jest.fn().mockResolvedValue(mockCustomerDto),
    };

    pdfEncryptionService = {
      encrypt: jest.fn().mockResolvedValue(Buffer.from('encrypted-pdf')),
    };

    smsService = {
      send: jest.fn().mockResolvedValue('message-id'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PdfService, useValue: pdfService },
        { provide: StorageService, useValue: storageService },
        { provide: MailService, useValue: mailService },
        { provide: CustomersService, useValue: customersService },
        { provide: PortalService, useValue: { generatePortalToken: jest.fn().mockResolvedValue('https://portal-url') } },
        { provide: SettingsService, useValue: { get: jest.fn().mockResolvedValue('') } },
        { provide: RentalDriversService, useValue: { findByRentalId: jest.fn().mockResolvedValue(null) } },
        { provide: PdfEncryptionService, useValue: pdfEncryptionService },
        { provide: SmsService, useValue: smsService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
              const configMap: Record<string, string> = {
                COMPANY_NAME: 'KITEK',
                COMPANY_OWNER: 'Pawel Romanowski',
                COMPANY_ADDRESS: 'ul. Sieradzka 18, 87-100 Torun',
                COMPANY_PHONE: '535 766 666 / 602 367 100',
              };
              return configMap[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);

    // Pre-compute contentHash for mockContract
    mockContract.contentHash = service.generateContentHash(
      mockContract.contractData as ContractFrozenData,
    );
  });

  // CONT-01: Contract creation
  describe('create()', () => {
    it('creates contract from rental data', async () => {
      prisma.rental.findUnique.mockResolvedValue(mockRental);
      prisma.contract.findFirst.mockResolvedValue(null);
      prisma.contract.create.mockResolvedValue({
        ...mockContract,
        signatures: [],
        annexes: [],
      });

      const result = await service.create(
        {
          rentalId: 'rental-1',
          depositAmount: 50000,
          lateFeeNet: 5000,
          rodoConsentAt: '2026-03-24T10:00:00Z',
        },
        'user-1',
      );

      expect(result).toBeDefined();
      expect(result.contractNumber).toBe('KITEK/2026/0324/0001');
      expect(result.status).toBe(ContractStatus.DRAFT);
      expect(prisma.rental.findUnique).toHaveBeenCalledWith({
        where: { id: 'rental-1' },
        include: { vehicle: { include: { vehicleClass: true } }, customer: true },
      });
      expect(customersService.findOne).toHaveBeenCalledWith('customer-1');
    });

    it('freezes contractData as JSON snapshot', async () => {
      prisma.rental.findUnique.mockResolvedValue(mockRental);
      prisma.contract.findFirst.mockResolvedValue(null);
      prisma.contract.create.mockImplementation(({ data }: any) => {
        expect(data.contractData).toHaveProperty('company');
        expect(data.contractData).toHaveProperty('customer');
        expect(data.contractData).toHaveProperty('vehicle');
        expect(data.contractData).toHaveProperty('rental');
        expect(data.contractData).toHaveProperty('conditions');
        expect(data.contractData.company.name).toBe('KITEK');
        expect(data.contractData.customer.firstName).toBe('Jan');
        expect(data.contractData.vehicle.registration).toBe('TO 12345');
        return {
          ...mockContract,
          contractData: data.contractData,
          signatures: [],
          annexes: [],
        };
      });

      await service.create(
        {
          rentalId: 'rental-1',
          depositAmount: 50000,
          lateFeeNet: 5000,
          rodoConsentAt: '2026-03-24T10:00:00Z',
        },
        'user-1',
      );

      expect(prisma.contract.create).toHaveBeenCalled();
    });

    it('generates contract number in KITEK/YYYY/MMDD/XXXX format', async () => {
      prisma.rental.findUnique.mockResolvedValue(mockRental);
      prisma.contract.findFirst.mockResolvedValue(null);
      prisma.contract.create.mockImplementation(({ data }: any) => {
        // Verify format: KITEK/YYYY/MMDD/XXXX
        expect(data.contractNumber).toMatch(/^KITEK\/\d{4}\/\d{4}\/\d{4}$/);
        return { ...mockContract, contractNumber: data.contractNumber, signatures: [], annexes: [] };
      });

      await service.create(
        {
          rentalId: 'rental-1',
          rodoConsentAt: '2026-03-24T10:00:00Z',
        },
        'user-1',
      );
    });

    it('throws NotFoundException if rental not found', async () => {
      prisma.rental.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          { rentalId: 'nonexistent', rodoConsentAt: '2026-03-24T10:00:00Z' },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if active contract exists', async () => {
      prisma.rental.findUnique.mockResolvedValue(mockRental);
      prisma.contract.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create(
          { rentalId: 'rental-1', rodoConsentAt: '2026-03-24T10:00:00Z' },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('uploads damage sketch to MinIO when provided', async () => {
      prisma.rental.findUnique.mockResolvedValue(mockRental);
      prisma.contract.findFirst.mockResolvedValue(null);
      prisma.contract.create.mockResolvedValue({
        ...mockContract,
        signatures: [],
        annexes: [],
      });

      await service.create(
        {
          rentalId: 'rental-1',
          damageSketchBase64: Buffer.from('sketch').toString('base64'),
          rodoConsentAt: '2026-03-24T10:00:00Z',
        },
        'user-1',
      );

      expect(storageService.upload).toHaveBeenCalledWith(
        'contracts/rental-1/damage-sketch.png',
        expect.any(Buffer),
        'image/png',
      );
    });
  });

  // CONT-01: Content hash
  describe('generateContentHash()', () => {
    it('generates deterministic hash from frozen data', () => {
      const data = mockContract.contractData as ContractFrozenData;
      const hash1 = service.generateContentHash(data);
      const hash2 = service.generateContentHash(data);
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('generates different hash for different data', () => {
      const data1 = mockContract.contractData as ContractFrozenData;
      const data2 = {
        ...data1,
        customer: { ...data1.customer, firstName: 'Adam' },
      };
      const hash1 = service.generateContentHash(data1);
      const hash2 = service.generateContentHash(data2);
      expect(hash1).not.toBe(hash2);
    });
  });

  // CONT-02: Signature handling
  describe('sign()', () => {
    it('stores signature PNG in MinIO', async () => {
      prisma.contract.findUnique
        .mockResolvedValueOnce({ ...mockContract, signatures: [] })
        .mockResolvedValueOnce({ ...mockContract, status: 'PARTIALLY_SIGNED', signatures: [{ signatureType: 'customer_page1' }] });
      prisma.contractSignature.upsert.mockResolvedValue({});
      prisma.contractSignature.count.mockResolvedValue(1);
      prisma.contract.update.mockResolvedValue({});

      await service.sign(
        'contract-1',
        {
          signatureType: 'customer_page1',
          signatureBase64: Buffer.from('sig').toString('base64'),
        },
        'user-1',
        '127.0.0.1',
      );

      expect(storageService.upload).toHaveBeenCalledWith(
        'contracts/rental-1/signatures/customer_page1.png',
        expect.any(Buffer),
        'image/png',
      );
    });

    it('transitions contract status to PARTIALLY_SIGNED on first signature', async () => {
      prisma.contract.findUnique
        .mockResolvedValueOnce({ ...mockContract, status: 'DRAFT', signatures: [] })
        .mockResolvedValueOnce({ ...mockContract, status: 'PARTIALLY_SIGNED', signatures: [] });
      prisma.contractSignature.upsert.mockResolvedValue({});
      prisma.contractSignature.count.mockResolvedValue(1);
      prisma.contract.update.mockResolvedValue({});

      await service.sign(
        'contract-1',
        {
          signatureType: 'customer_page1',
          signatureBase64: Buffer.from('sig').toString('base64'),
        },
        'user-1',
        '127.0.0.1',
      );

      expect(prisma.contract.update).toHaveBeenCalledWith({
        where: { id: 'contract-1' },
        data: { status: ContractStatus.PARTIALLY_SIGNED },
      });
    });

    it('transitions contract status to SIGNED when all signatures collected', async () => {
      prisma.contract.findUnique
        .mockResolvedValueOnce({ ...mockContract, status: 'PARTIALLY_SIGNED', signatures: [] })
        .mockResolvedValueOnce({ ...mockContract, status: 'SIGNED', signatures: [] });
      prisma.contractSignature.upsert.mockResolvedValue({});
      prisma.contractSignature.count.mockResolvedValue(4);
      prisma.contractSignature.findUnique.mockResolvedValue({
        signatureKey: 'contracts/rental-1/signatures/customer_page1.png',
      });
      prisma.contract.update.mockResolvedValue({});

      await service.sign(
        'contract-1',
        {
          signatureType: 'employee_page2',
          signatureBase64: Buffer.from('sig').toString('base64'),
        },
        'user-1',
        '127.0.0.1',
      );

      expect(prisma.contract.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ContractStatus.SIGNED }),
        }),
      );
    });

    it('throws BadRequestException if contract data was tampered', async () => {
      const tampered = {
        ...mockContract,
        contentHash: 'wrong-hash',
        signatures: [],
      };
      prisma.contract.findUnique.mockResolvedValue(tampered);

      await expect(
        service.sign(
          'contract-1',
          {
            signatureType: 'customer_page1',
            signatureBase64: Buffer.from('sig').toString('base64'),
          },
          'user-1',
          '127.0.0.1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for SIGNED contract', async () => {
      prisma.contract.findUnique.mockResolvedValue({
        ...mockContract,
        status: 'SIGNED',
      });

      await expect(
        service.sign(
          'contract-1',
          {
            signatureType: 'customer_page1',
            signatureBase64: Buffer.from('sig').toString('base64'),
          },
          'user-1',
          '127.0.0.1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // CONT-03: PDF generation
  describe('PDF generation', () => {
    it('generates PDF after all signatures collected', async () => {
      prisma.contract.findUnique
        .mockResolvedValueOnce({ ...mockContract, status: 'PARTIALLY_SIGNED', signatures: [] })
        .mockResolvedValueOnce({ ...mockContract, status: 'SIGNED', signatures: [] });
      prisma.contractSignature.upsert.mockResolvedValue({});
      prisma.contractSignature.count.mockResolvedValue(4);
      prisma.contractSignature.findUnique.mockResolvedValue({
        signatureKey: 'contracts/rental-1/signatures/sig.png',
      });
      prisma.contract.update.mockResolvedValue({});

      await service.sign(
        'contract-1',
        {
          signatureType: 'employee_page2',
          signatureBase64: Buffer.from('sig').toString('base64'),
        },
        'user-1',
        '127.0.0.1',
      );

      expect(pdfService.generateContractPdf).toHaveBeenCalled();
      expect(storageService.upload).toHaveBeenCalledWith(
        `contracts/rental-1/contract-1.pdf`,
        expect.any(Buffer),
        'application/pdf',
      );
    });
  });

  // CONT-04: Email delivery
  describe('email delivery', () => {
    // Helper to flush setImmediate queue (email is fire-and-forget)
    const flushSetImmediate = () =>
      new Promise((resolve) => setImmediate(resolve));

    it('sends email with PDF attachment after generation', async () => {
      prisma.contract.findUnique
        .mockResolvedValueOnce({ ...mockContract, status: 'PARTIALLY_SIGNED', signatures: [] })
        .mockResolvedValueOnce({ ...mockContract, status: 'SIGNED', signatures: [] });
      prisma.contractSignature.upsert.mockResolvedValue({});
      prisma.contractSignature.count.mockResolvedValue(4);
      prisma.contractSignature.findUnique.mockResolvedValue({
        signatureKey: 'contracts/rental-1/signatures/sig.png',
      });
      prisma.contract.update.mockResolvedValue({});
      prisma.rental.findUnique.mockResolvedValue({ customerId: 'customer-1' });

      await service.sign(
        'contract-1',
        {
          signatureType: 'employee_page2',
          signatureBase64: Buffer.from('sig').toString('base64'),
        },
        'user-1',
        '127.0.0.1',
      );

      // Email is sent via setImmediate (fire-and-forget), flush the queue
      await flushSetImmediate();

      expect(pdfEncryptionService.encrypt).toHaveBeenCalledWith(
        expect.any(Buffer),
        'TO 12345',
      );
      expect(mailService.sendContractEmail).toHaveBeenCalledWith(
        'jan@example.com',
        'Jan Kowalski',
        'TO 12345',
        'KITEK/2026/0324/0001',
        Buffer.from('encrypted-pdf'),
        expect.any(String),
        null,
      );
    });
  });

  // CONT-05: Annex
  describe('createAnnex()', () => {
    it('creates annex with correct annex number', async () => {
      prisma.contract.findFirst.mockResolvedValue(mockContract);
      prisma.contractAnnex.count.mockResolvedValue(0);
      prisma.contractAnnex.create.mockResolvedValue({
        id: 'annex-1',
        contractId: 'contract-1',
        annexNumber: 1,
        changes: { newEndDate: '2026-03-15', oldEndDate: '2026-03-10T00:00:00.000Z' },
        pdfKey: 'contracts/rental-1/annexes/annex-1.pdf',
        pdfGeneratedAt: new Date(),
        emailSentAt: new Date(),
        createdAt: new Date(),
      });

      const result = await service.createAnnex('rental-1', {
        newEndDate: '2026-03-15',
        createdById: 'user-1',
      });

      expect(result).toBeDefined();
      expect(result!.annexNumber).toBe(1);
      // Verify single create call (no subsequent update)
      expect(prisma.contractAnnex.create).toHaveBeenCalledTimes(1);
      expect(prisma.contractAnnex.update).not.toHaveBeenCalled();
    });

    it('generates annex PDF before DB write', async () => {
      prisma.contract.findFirst.mockResolvedValue(mockContract);
      prisma.contractAnnex.count.mockResolvedValue(0);
      prisma.contractAnnex.create.mockResolvedValue({
        id: 'annex-1',
        contractId: 'contract-1',
        annexNumber: 1,
        changes: {},
        pdfKey: 'key',
        pdfGeneratedAt: new Date(),
        emailSentAt: new Date(),
        createdAt: new Date(),
      });

      await service.createAnnex('rental-1', {
        newEndDate: '2026-03-15',
        createdById: 'user-1',
      });

      expect(pdfService.generateAnnexPdf).toHaveBeenCalled();
      // PDF generated before create (no update needed)
      expect(prisma.contractAnnex.update).not.toHaveBeenCalled();
    });

    it('emails annex PDF to customer', async () => {
      prisma.contract.findFirst.mockResolvedValue(mockContract);
      prisma.contractAnnex.count.mockResolvedValue(0);
      prisma.contractAnnex.create.mockResolvedValue({
        id: 'annex-1',
        contractId: 'contract-1',
        annexNumber: 1,
        changes: {},
        pdfKey: 'key',
        pdfGeneratedAt: new Date(),
        emailSentAt: new Date(),
        createdAt: new Date(),
      });

      await service.createAnnex('rental-1', {
        newEndDate: '2026-03-15',
        createdById: 'user-1',
      });

      expect(pdfEncryptionService.encrypt).toHaveBeenCalledWith(
        expect.any(Buffer),
        'TO 12345',
      );
      expect(mailService.sendAnnexEmail).toHaveBeenCalledWith(
        'jan@example.com',
        'Jan Kowalski',
        'KITEK/2026/0324/0001',
        1,
        Buffer.from('encrypted-pdf'),
        null,
      );
    });

    it('returns null when no signed contract exists', async () => {
      prisma.contract.findFirst.mockResolvedValue(null);

      const result = await service.createAnnex('rental-1', {
        newEndDate: '2026-03-15',
        createdById: 'user-1',
      });

      expect(result).toBeNull();
    });
  });

  // UMOWA-05/06: Contract delivery - encryption and SMS
  describe('contract delivery - encryption and SMS', () => {
    // Helper to flush setImmediate queue (email is fire-and-forget)
    const flushSetImmediate = () =>
      new Promise((resolve) => setImmediate(resolve));

    // Common setup for a fully-signed contract scenario
    const setupFullySignedContract = () => {
      prisma.contract.findUnique
        .mockResolvedValueOnce({ ...mockContract, status: 'PARTIALLY_SIGNED', signatures: [] })
        .mockResolvedValueOnce({ ...mockContract, status: 'SIGNED', signatures: [] });
      prisma.contractSignature.upsert.mockResolvedValue({});
      prisma.contractSignature.count.mockResolvedValue(4);
      prisma.contractSignature.findUnique.mockResolvedValue({
        signatureKey: 'contracts/rental-1/signatures/sig.png',
      });
      prisma.contract.update.mockResolvedValue({});
      prisma.rental.findUnique.mockResolvedValue({ customerId: 'customer-1', status: 'DRAFT', vehicleId: 'vehicle-1' });
    };

    const signLastSignature = () =>
      service.sign(
        'contract-1',
        {
          signatureType: 'employee_page2',
          signatureBase64: Buffer.from('sig').toString('base64'),
        },
        'user-1',
        '127.0.0.1',
      );

    it('encrypts PDF before sending contract email', async () => {
      setupFullySignedContract();

      await signLastSignature();
      await flushSetImmediate();

      expect(pdfEncryptionService.encrypt).toHaveBeenCalledWith(
        expect.any(Buffer),
        'TO 12345',
      );
      expect(mailService.sendContractEmail).toHaveBeenCalledWith(
        'jan@example.com',
        'Jan Kowalski',
        'TO 12345',
        'KITEK/2026/0324/0001',
        Buffer.from('encrypted-pdf'),
        expect.any(String),
        null,
      );
    });

    it('sends SMS with password after successful contract email', async () => {
      setupFullySignedContract();

      await signLastSignature();
      await flushSetImmediate();

      expect(smsService.send).toHaveBeenCalledWith(
        '+48123456789',
        'Haslo do PDF umowy: TO 12345. KITEK',
      );
    });

    it('does NOT send SMS if encryption fails for contract', async () => {
      setupFullySignedContract();
      pdfEncryptionService.encrypt.mockRejectedValue(new Error('encryption failed'));

      await signLastSignature();
      await flushSetImmediate();

      expect(mailService.sendContractEmail).not.toHaveBeenCalled();
      expect(smsService.send).not.toHaveBeenCalled();
    });

    it('does NOT send SMS if contract email fails', async () => {
      setupFullySignedContract();
      mailService.sendContractEmail.mockRejectedValue(new Error('email failed'));

      await signLastSignature();
      await flushSetImmediate();

      expect(pdfEncryptionService.encrypt).toHaveBeenCalled();
      expect(smsService.send).not.toHaveBeenCalled();
    });

    it('encrypts PDF before sending annex email', async () => {
      prisma.contract.findFirst.mockResolvedValue(mockContract);
      prisma.contractAnnex.count.mockResolvedValue(0);
      prisma.contractAnnex.create.mockResolvedValue({
        id: 'annex-1',
        contractId: 'contract-1',
        annexNumber: 1,
        changes: {},
        pdfKey: 'key',
        pdfGeneratedAt: new Date(),
        emailSentAt: new Date(),
        createdAt: new Date(),
      });

      await service.createAnnex('rental-1', {
        newEndDate: '2026-03-15',
        createdById: 'user-1',
      });

      // Encryption is called before sendAnnexEmail
      expect(pdfEncryptionService.encrypt).toHaveBeenCalledWith(
        expect.any(Buffer),
        'TO 12345',
      );
      expect(mailService.sendAnnexEmail).toHaveBeenCalledWith(
        'jan@example.com',
        'Jan Kowalski',
        'KITEK/2026/0324/0001',
        1,
        Buffer.from('encrypted-pdf'),
        null,
      );
    });

    it('sends SMS with password after successful annex email', async () => {
      prisma.contract.findFirst.mockResolvedValue(mockContract);
      prisma.contractAnnex.count.mockResolvedValue(0);
      prisma.contractAnnex.create.mockResolvedValue({
        id: 'annex-1',
        contractId: 'contract-1',
        annexNumber: 1,
        changes: {},
        pdfKey: 'key',
        pdfGeneratedAt: new Date(),
        emailSentAt: new Date(),
        createdAt: new Date(),
      });

      await service.createAnnex('rental-1', {
        newEndDate: '2026-03-15',
        createdById: 'user-1',
      });

      expect(smsService.send).toHaveBeenCalledWith(
        '+48123456789',
        'Haslo do PDF umowy: TO 12345. KITEK',
      );
    });

    it('does NOT send annex email or SMS if encryption fails', async () => {
      prisma.contract.findFirst.mockResolvedValue(mockContract);
      prisma.contractAnnex.count.mockResolvedValue(0);
      prisma.contractAnnex.create.mockResolvedValue({
        id: 'annex-1',
        contractId: 'contract-1',
        annexNumber: 1,
        changes: {},
        pdfKey: 'key',
        pdfGeneratedAt: new Date(),
        emailSentAt: null,
        createdAt: new Date(),
      });
      pdfEncryptionService.encrypt.mockRejectedValue(new Error('encryption failed'));

      await service.createAnnex('rental-1', {
        newEndDate: '2026-03-15',
        createdById: 'user-1',
      });

      expect(mailService.sendAnnexEmail).not.toHaveBeenCalled();
      expect(smsService.send).not.toHaveBeenCalled();
    });
  });
});
