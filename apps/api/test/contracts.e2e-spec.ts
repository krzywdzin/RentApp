import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/mail/mail.service';
import { StorageService } from '../src/storage/storage.service';
import { PdfService } from '../src/contracts/pdf/pdf.service';
import { SmsService } from '../src/notifications/sms/sms.service';
import { UserRole, RentalStatus } from '@rentapp/shared';
import Redis from 'ioredis';

const ARGON2_OPTIONS = { memoryCost: 32768, timeCost: 3, parallelism: 1 };
const VALID_PESEL = '44051401359';

jest.setTimeout(30000);

describe('Contracts (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: Redis;
  let adminToken: string;
  let employeeToken: string;
  let mockMailService: Record<string, jest.Mock>;
  let mockStorageService: Record<string, jest.Mock>;
  let mockPdfService: Record<string, jest.Mock>;

  const adminEmail = 'contract-admin@test.com';
  const adminPassword = 'ContractAdmin1!';
  const employeeEmail = 'contract-employee@test.com';
  const employeePassword = 'ContractEmployee1!';
  const deviceId = '00000000-0000-4000-a000-000000000020';

  let vehicleId: string;
  let customerId: string;
  let rentalId: string;

  beforeAll(async () => {
    mockMailService = {
      sendSetupPasswordEmail: jest.fn(),
      sendResetPasswordEmail: jest.fn(),
      sendContractEmail: jest.fn().mockResolvedValue(undefined),
      sendAnnexEmail: jest.fn().mockResolvedValue(undefined),
    };

    mockStorageService = {
      onModuleInit: jest.fn(),
      upload: jest.fn().mockResolvedValue('mock-key'),
      getBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image-data')),
      getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://mock-url'),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    mockPdfService = {
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
      generateContractPdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf')),
      generateAnnexPdf: jest.fn().mockResolvedValue(Buffer.from('mock-annex-pdf')),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(mockMailService)
      .overrideProvider(StorageService)
      .useValue(mockStorageService)
      .overrideProvider(PdfService)
      .useValue(mockPdfService)
      .overrideProvider(SmsService)
      .useValue({ normalizePhone: jest.fn((p: string) => p), send: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    redis = new Redis(process.env.REDIS_URL!);

    // Force fresh DB connection to avoid stale cached plans after schema reset
    try { await prisma.$executeRawUnsafe('DEALLOCATE ALL'); } catch {}
    await prisma.$disconnect();
    await prisma.$connect();

    await redis.flushdb();

    // Clean up from previous runs (full dependency order)
    await prisma.cepikVerification.deleteMany({});
    await prisma.inAppNotification.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.damageReport.deleteMany({});
    await prisma.walkthroughPhoto.deleteMany({});
    await prisma.photoWalkthrough.deleteMany({});
    await prisma.contractSignature.deleteMany({});
    await prisma.contractAnnex.deleteMany({});
    await prisma.contract.deleteMany({});
    await prisma.rental.deleteMany({});
    await prisma.vehicleDocument.deleteMany({});
    await prisma.vehicleInsurance.deleteMany({});
    await prisma.vehicleInspection.deleteMany({});
    await prisma.vehicle.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});

    // Seed admin user
    const adminHash = await argon2.hash(adminPassword, ARGON2_OPTIONS);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Contract Admin',
        role: UserRole.ADMIN,
        passwordHash: adminHash,
        isActive: true,
      },
    });

    // Seed employee user
    const empHash = await argon2.hash(employeePassword, ARGON2_OPTIONS);
    await prisma.user.create({
      data: {
        email: employeeEmail,
        name: 'Contract Employee',
        role: UserRole.EMPLOYEE,
        passwordHash: empHash,
        isActive: true,
      },
    });

    // Login both
    const adminRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword, deviceId });
    adminToken = adminRes.body.accessToken;

    const empRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: employeeEmail,
        password: employeePassword,
        deviceId: '00000000-0000-4000-a000-000000000021',
      });
    employeeToken = empRes.body.accessToken;

    // Create vehicle
    const vRes = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        registration: 'CT12345',
        vin: 'WVWZZZ3CZWE300001',
        make: 'Toyota',
        model: 'Corolla',
        year: 2023,
        fuelType: 'PETROL',
        transmission: 'AUTOMATIC',
        color: 'White',
        mileage: 50000,
      })
      .expect(201);
    vehicleId = vRes.body.id;

    // Create customer
    const cRes = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Jan',
        lastName: 'Kowalski',
        phone: '+48123456789',
        email: 'jan-contract@example.com',
        address: 'ul. Testowa 1, Warszawa',
        pesel: VALID_PESEL,
        idNumber: 'ABC123456',
        licenseNumber: 'DRV789012',
        idIssuedBy: 'Urzad Miasta Warszawa',
        idIssuedDate: '2020-01-15',
        licenseCategory: 'B',
        licenseIssuedBy: 'Starostwo Powiatowe',
      })
      .expect(201);
    customerId = cRes.body.id;

    // Create active rental
    const rRes = await request(app.getHttpServer())
      .post('/rentals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vehicleId,
        customerId,
        startDate: '2026-03-01T00:00:00Z',
        endDate: '2026-03-10T00:00:00Z',
        dailyRateNet: 10000,
        totalPriceNet: 90000,
        vatRate: 23,
        status: RentalStatus.ACTIVE,
      })
      .expect(201);
    rentalId = rRes.body.id;
  }, 30000);

  afterAll(async () => {
    await prisma.cepikVerification.deleteMany({});
    await prisma.inAppNotification.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.damageReport.deleteMany({});
    await prisma.walkthroughPhoto.deleteMany({});
    await prisma.photoWalkthrough.deleteMany({});
    await prisma.contractSignature.deleteMany({});
    await prisma.contractAnnex.deleteMany({});
    await prisma.contract.deleteMany({});
    await prisma.rental.deleteMany({});
    await prisma.vehicleDocument.deleteMany({});
    await prisma.vehicleInsurance.deleteMany({});
    await prisma.vehicleInspection.deleteMany({});
    await prisma.vehicle.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});
    await redis.flushdb();
    await redis.quit();
    await app.close();
  });

  describe('POST /contracts', () => {
    it('creates contract from rental, returns 201 with contract data', async () => {
      const res = await request(app.getHttpServer())
        .post('/contracts')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          rentalId,
          depositAmount: 50000,
          lateFeeNet: 5000,
          rodoConsentAt: '2026-03-24T10:00:00Z',
        })
        .expect(201);

      expect(res.body.contractNumber).toMatch(/^KITEK\/\d{4}\/\d{4}\/\d{4}$/);
      expect(res.body.contentHash).toBeDefined();
      expect(res.body.status).toBe('DRAFT');
      expect(res.body.rentalId).toBe(rentalId);
      expect(res.body.contractData).toBeDefined();
      expect(res.body.contractData.company.name).toBe('KITEK');
    });

    it('returns 404 for invalid rentalId', async () => {
      await request(app.getHttpServer())
        .post('/contracts')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          rentalId: '00000000-0000-4000-a000-000000000099',
          rodoConsentAt: '2026-03-24T10:00:00Z',
        })
        .expect(404);
    });

    it('returns 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post('/contracts')
        .send({
          rentalId,
          rodoConsentAt: '2026-03-24T10:00:00Z',
        })
        .expect(401);
    });
  });

  describe('POST /contracts/:id/sign', () => {
    let contractId: string;

    beforeAll(async () => {
      // Clean existing contracts to have a fresh one
      await prisma.contractSignature.deleteMany({});
      await prisma.contractAnnex.deleteMany({});
      await prisma.contract.deleteMany({});

      const res = await request(app.getHttpServer())
        .post('/contracts')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          rentalId,
          depositAmount: 50000,
          lateFeeNet: 5000,
          rodoConsentAt: '2026-03-24T10:00:00Z',
        })
        .expect(201);
      contractId = res.body.id;
    });

    it('accepts customer_page1 signature, returns PARTIALLY_SIGNED', async () => {
      const res = await request(app.getHttpServer())
        .post(`/contracts/${contractId}/sign`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          signatureType: 'customer_page1',
          signatureBase64: Buffer.from('sig-data-1').toString('base64'),
          deviceInfo: 'iPad Pro',
        })
        .expect(200);

      expect(res.body.status).toBe('PARTIALLY_SIGNED');
    });

    it('full flow: sign all 4 and get SIGNED with PDF generation and email', async () => {
      // Sign remaining 3 (customer_page1 already done)
      const signatures = ['employee_page1', 'customer_page2', 'employee_page2'];
      for (const sigType of signatures) {
        await request(app.getHttpServer())
          .post(`/contracts/${contractId}/sign`)
          .set('Authorization', `Bearer ${employeeToken}`)
          .send({
            signatureType: sigType,
            signatureBase64: Buffer.from(`sig-${sigType}`).toString('base64'),
          })
          .expect(200);
      }

      // Verify the contract is now SIGNED
      const res = await request(app.getHttpServer())
        .get(`/contracts/${contractId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(res.body.status).toBe('SIGNED');
      expect(res.body.signatures).toHaveLength(4);
      expect(mockPdfService.generateContractPdf).toHaveBeenCalled();
      expect(mockMailService.sendContractEmail).toHaveBeenCalled();
    });
  });

  describe('GET /contracts/:id', () => {
    it('returns full contract with signatures array', async () => {
      const contracts = await prisma.contract.findMany({ take: 1 });
      if (contracts.length === 0) return;

      const res = await request(app.getHttpServer())
        .get(`/contracts/${contracts[0].id}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(res.body.id).toBe(contracts[0].id);
      expect(res.body.signatures).toBeDefined();
      expect(Array.isArray(res.body.signatures)).toBe(true);
    });
  });

  describe('GET /contracts/rental/:rentalId', () => {
    it('returns contracts for rental', async () => {
      const res = await request(app.getHttpServer())
        .get(`/contracts/rental/${rentalId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].rentalId).toBe(rentalId);
    });
  });
});
