import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/mail/mail.service';
import { StorageService } from '../src/storage/storage.service';
import { SmsService } from '../src/notifications/sms/sms.service';
import { PdfService } from '../src/contracts/pdf/pdf.service';
import { UserRole, CepikVerificationStatus } from '@rentapp/shared';
import Redis from 'ioredis';

const ARGON2_OPTIONS = { memoryCost: 32768, timeCost: 3, parallelism: 1 };
const VALID_PESEL = '44051401359';

describe('CEPiK Verification (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: Redis;
  let adminToken: string;
  let employeeToken: string;
  let customerId: string;
  let rentalId: string;

  const adminEmail = 'cepik-admin@test.com';
  const adminPassword = 'CepikAdmin1!';
  const employeeEmail = 'cepik-employee@test.com';
  const employeePassword = 'CepikEmployee1!';
  const deviceId = '00000000-0000-4000-a000-000000000090';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue({
        sendSetupPasswordEmail: jest.fn(),
        sendResetPasswordEmail: jest.fn(),
        sendRaw: jest.fn(),
      })
      .overrideProvider(StorageService)
      .useValue({
        upload: jest.fn().mockResolvedValue('mock-key'),
        getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://mock-url'),
        getBuffer: jest.fn().mockResolvedValue(Buffer.from('mock')),
        delete: jest.fn().mockResolvedValue(undefined),
        onModuleInit: jest.fn(),
      })
      .overrideProvider(SmsService)
      .useValue({
        normalizePhone: jest.fn().mockImplementation((p: string) => p.replace(/[+\s-]/g, '')),
        send: jest.fn().mockResolvedValue('sms-123'),
      })
      .overrideProvider(PdfService)
      .useValue({
        onModuleInit: jest.fn(),
        onModuleDestroy: jest.fn(),
        generateContractPdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf')),
        generateAnnexPdf: jest.fn().mockResolvedValue(Buffer.from('mock-annex-pdf')),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    redis = new Redis(process.env.REDIS_URL!);
    await redis.flushdb();

    // Clean up from previous runs (order matters for FK constraints)
    await prisma.inAppNotification.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.alertConfig.deleteMany({});
    await prisma.cepikVerification.deleteMany({});
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

    // Seed admin
    const adminHash = await argon2.hash(adminPassword, ARGON2_OPTIONS);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'CEPiK Admin',
        role: UserRole.ADMIN,
        passwordHash: adminHash,
        isActive: true,
      },
    });

    // Seed employee
    const empHash = await argon2.hash(employeePassword, ARGON2_OPTIONS);
    await prisma.user.create({
      data: {
        email: employeeEmail,
        name: 'CEPiK Employee',
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
        deviceId: '00000000-0000-4000-a000-000000000091',
      });
    employeeToken = empRes.body.accessToken;

    // Create test data directly via Prisma for reliability
    const admin = await prisma.user.findFirst({ where: { email: adminEmail } });

    const customer = await prisma.customer.create({
      data: {
        firstName: 'Anna',
        lastName: 'Nowak',
        phone: '+48600700800',
        email: 'anna-cepik@example.com',
        address: 'ul. CEPiK 10, Krakow',
        peselEncrypted: { data: 'encrypted-pesel' },
        peselHmac: 'hmac-pesel-cepik',
        idNumberEncrypted: { data: 'encrypted-id' },
        idNumberHmac: 'hmac-id-cepik',
        licenseNumEncrypted: { data: 'encrypted-license' },
        licenseNumHmac: 'hmac-license-cepik',
        idIssuedBy: 'Urzad Miasta Krakow',
        idIssuedDate: new Date('2020-06-15'),
        licenseCategory: 'B',
        licenseIssuedBy: 'Starostwo Powiatowe',
      },
    });
    customerId = customer.id;

    const vehicle = await prisma.vehicle.create({
      data: {
        registration: 'CK12345',
        vin: 'WVWZZZ3CZWE300001',
        make: 'Skoda',
        model: 'Octavia',
        year: 2023,
        fuelType: 'PETROL',
        transmission: 'MANUAL',
        color: 'Black',
        mileage: 30000,
        status: 'AVAILABLE',
      },
    });

    const rental = await prisma.rental.create({
      data: {
        vehicleId: vehicle.id,
        customerId,
        createdById: admin!.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 86400000),
        dailyRateNet: 15000,
        totalPriceNet: 105000,
        totalPriceGross: 129150,
        vatRate: 23,
        status: 'DRAFT',
      },
    });
    rentalId = rental.id;
  }, 30000);

  afterAll(async () => {
    await prisma.inAppNotification.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.alertConfig.deleteMany({});
    await prisma.cepikVerification.deleteMany({});
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
    await redis.quit();
    await app.close();
  }, 15000);

  describe('POST /cepik/verify', () => {
    it('should verify license and return PASSED status', async () => {
      const res = await request(app.getHttpServer())
        .post('/cepik/verify')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          customerId,
          rentalId,
          firstName: 'Anna',
          lastName: 'Nowak',
          licenseNumber: 'LIC789012',
          requiredCategory: 'B',
        })
        .expect(201);

      expect(res.body.status).toBe(CepikVerificationStatus.PASSED);
      expect(res.body.result.source).toBe('STUB');
      expect(res.body.result.licenseValid).toBe(true);
      expect(res.body.result.categoryMatch).toBe(true);
      // __audit is consumed by AuditInterceptor and stripped from response
    });

    it('should return result with license categories', async () => {
      const res = await request(app.getHttpServer())
        .post('/cepik/verify')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          customerId,
          firstName: 'Anna',
          lastName: 'Nowak',
          licenseNumber: 'LIC789012',
        })
        .expect(201);

      expect(res.body.result.licenseCategories).toContain('B');
    });

    it('should store verification in database', async () => {
      const verifyRes = await request(app.getHttpServer())
        .post('/cepik/verify')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          customerId,
          rentalId,
          firstName: 'Anna',
          lastName: 'Nowak',
          licenseNumber: 'LIC789012',
          requiredCategory: 'B',
        })
        .expect(201);

      const lookupRes = await request(app.getHttpServer())
        .get(`/cepik/verify/rental/${rentalId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(lookupRes.body.customerId).toBe(customerId);
      expect(lookupRes.body.rentalId).toBe(rentalId);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .post('/cepik/verify')
        .send({
          customerId,
          firstName: 'Anna',
          lastName: 'Nowak',
          licenseNumber: 'LIC789012',
        })
        .expect(401);
    });

    it('should allow ADMIN to verify', async () => {
      const res = await request(app.getHttpServer())
        .post('/cepik/verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId,
          firstName: 'Anna',
          lastName: 'Nowak',
          licenseNumber: 'LIC789012',
        })
        .expect(201);

      expect(res.body.status).toBe(CepikVerificationStatus.PASSED);
    });
  });

  describe('POST /cepik/verify/:id/override', () => {
    let verificationId: string;

    beforeAll(async () => {
      // Create a verification to override
      const res = await request(app.getHttpServer())
        .post('/cepik/verify')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          customerId,
          firstName: 'Anna',
          lastName: 'Nowak',
          licenseNumber: 'LIC789012',
          requiredCategory: 'C', // will result in category mismatch -> FAILED
        })
        .expect(201);
      verificationId = res.body.id;
    });

    it('should allow ADMIN to override verification', async () => {
      const res = await request(app.getHttpServer())
        .post(`/cepik/verify/${verificationId}/override`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Document verified in person by admin' })
        .expect(201);

      expect(res.body.status).toBe(CepikVerificationStatus.OVERRIDDEN);
      expect(res.body.overrideReason).toBe('Document verified in person by admin');
      expect(res.body.overriddenById).toBeDefined();
      // __audit is consumed by AuditInterceptor and stripped from response
    });

    it('should reject EMPLOYEE override attempts', async () => {
      // Create a fresh verification for this test
      const vRes = await request(app.getHttpServer())
        .post('/cepik/verify')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          customerId,
          firstName: 'Anna',
          lastName: 'Nowak',
          licenseNumber: 'LIC789012',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/cepik/verify/${vRes.body.id}/override`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ reason: 'Employee trying to override' })
        .expect(403);
    });

    it('should require reason text with min 3 chars', async () => {
      const vRes = await request(app.getHttpServer())
        .post('/cepik/verify')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          customerId,
          firstName: 'Anna',
          lastName: 'Nowak',
          licenseNumber: 'LIC789012',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/cepik/verify/${vRes.body.id}/override`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'ab' }) // too short
        .expect(400);
    });

    it('should record override details', async () => {
      const vRes = await request(app.getHttpServer())
        .post('/cepik/verify')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          customerId,
          firstName: 'Anna',
          lastName: 'Nowak',
          licenseNumber: 'LIC789012',
        })
        .expect(201);

      const overrideRes = await request(app.getHttpServer())
        .post(`/cepik/verify/${vRes.body.id}/override`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Physical document check passed' })
        .expect(201);

      expect(overrideRes.body.overrideReason).toBe('Physical document check passed');
      expect(overrideRes.body.overriddenById).toBeDefined();
      expect(overrideRes.body.overriddenAt).toBeDefined();
    });
  });

  describe('GET /cepik/verify/rental/:rentalId', () => {
    it('should return 404 for rental without verification', async () => {
      await request(app.getHttpServer())
        .get('/cepik/verify/rental/00000000-0000-4000-a000-999999999999')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(404);
    });
  });
});
