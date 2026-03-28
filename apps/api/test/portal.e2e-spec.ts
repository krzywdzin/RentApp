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
import { PortalService } from '../src/portal/portal.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UserRole, RentalStatus } from '@rentapp/shared';
import Redis from 'ioredis';

const ARGON2_OPTIONS = { memoryCost: 32768, timeCost: 3, parallelism: 1 };

// Disable throttling for e2e tests to avoid 429 during rapid test execution
jest.spyOn(ThrottlerGuard.prototype, 'canActivate').mockResolvedValue(true);

describe('Customer Portal (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let portalService: PortalService;
  let redis: Redis;

  const adminEmail = 'portal-admin@test.com';
  const adminPassword = 'PortalAdmin1!';
  const deviceId = '00000000-0000-4000-a000-000000000030';

  let adminToken: string;
  let adminId: string;
  let customerId: string;
  let customer2Id: string;
  let vehicleId: string;
  let rentalId: string;
  let rental2Id: string;
  let otherCustomerRentalId: string;

  beforeAll(async () => {
    const mockMailService = {
      sendSetupPasswordEmail: jest.fn(),
      sendResetPasswordEmail: jest.fn(),
      sendContractEmail: jest.fn().mockResolvedValue(undefined),
      sendAnnexEmail: jest.fn().mockResolvedValue(undefined),
      sendRaw: jest.fn().mockResolvedValue(undefined),
    };

    const mockStorageService = {
      onModuleInit: jest.fn(),
      upload: jest.fn().mockResolvedValue('mock-key'),
      getBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image-data')),
      getPresignedDownloadUrl: jest
        .fn()
        .mockResolvedValue('https://mock-presigned-url'),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const mockPdfService = {
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
      generateContractPdf: jest
        .fn()
        .mockResolvedValue(Buffer.from('mock-pdf')),
      generateAnnexPdf: jest
        .fn()
        .mockResolvedValue(Buffer.from('mock-annex-pdf')),
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
      .useValue({
        send: jest.fn().mockResolvedValue({ success: true }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    portalService = app.get(PortalService);
    redis = new Redis(process.env.REDIS_URL!);
    await redis.flushdb();

    // Clean up from previous runs (order matters for FK constraints)
    await prisma.cepikVerification.deleteMany({});
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
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Portal Admin',
        role: UserRole.ADMIN,
        passwordHash: adminHash,
        isActive: true,
      },
    });
    adminId = admin.id;

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword, deviceId });
    adminToken = loginRes.body.accessToken;

    // Create vehicle
    const vRes = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        registration: 'CT 12345',
        make: 'Toyota',
        model: 'Corolla',
        year: 2022,
        vin: 'WVWZZZ3CZWE000001',
        mileage: 10000,
        status: 'AVAILABLE',
        fuelType: 'PETROL',
        transmission: 'AUTOMATIC',
        bodyType: 'SEDAN',
      });
    vehicleId = vRes.body.id;

    // Create customers via API
    const c1Res = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Jan',
        lastName: 'Kowalski',
        phone: '+48600100200',
        email: 'jan.kowalski@test.com',
        pesel: '44051401359',
        idNumber: 'ABC123456',
        licenseNumber: 'DL000111',
      });
    customerId = c1Res.body.id;

    const c2Res = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Anna',
        lastName: 'Nowak',
        phone: '+48600200300',
        email: 'anna.nowak@test.com',
        pesel: '92071314764',
        idNumber: 'DEF789012',
        licenseNumber: 'DL000222',
      });
    customer2Id = c2Res.body.id;

    // Create rentals for customer 1
    const r1Res = await request(app.getHttpServer())
      .post('/rentals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vehicleId,
        customerId,
        startDate: '2026-03-01T00:00:00Z',
        endDate: '2026-03-15T00:00:00Z',
        dailyRateNet: 15000,
        totalPriceNet: 210000,
        vatRate: 23,
        status: RentalStatus.ACTIVE,
      })
      .expect(201);
    rentalId = r1Res.body.id;

    // Create a second rental for customer 1
    const r2Res = await request(app.getHttpServer())
      .post('/rentals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vehicleId,
        customerId,
        startDate: '2026-04-01T00:00:00Z',
        endDate: '2026-04-10T00:00:00Z',
        dailyRateNet: 15000,
        totalPriceNet: 135000,
        vatRate: 23,
        status: RentalStatus.ACTIVE,
        overrideConflict: true,
      })
      .expect(201);
    rental2Id = r2Res.body.id;

    // Create a rental for customer 2 (other customer)
    const r3Res = await request(app.getHttpServer())
      .post('/rentals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vehicleId,
        customerId: customer2Id,
        startDate: '2026-05-01T00:00:00Z',
        endDate: '2026-05-10T00:00:00Z',
        dailyRateNet: 15000,
        totalPriceNet: 135000,
        vatRate: 23,
        status: RentalStatus.ACTIVE,
        overrideConflict: true,
      })
      .expect(201);
    otherCustomerRentalId = r3Res.body.id;

    // Create a signed contract for rental1
    await prisma.contract.create({
      data: {
        contractNumber: 'KITEK/2026/0301/0099',
        rental: { connect: { id: rentalId } },
        createdBy: { connect: { id: adminId } },
        status: 'SIGNED',
        contractData: {
          company: { name: 'KITEK' },
          customer: {
            firstName: 'Jan',
            lastName: 'Kowalski',
          },
          vehicle: {
            registration: 'CT 12345',
            make: 'Toyota',
            model: 'Corolla',
          },
          rental: {},
          conditions: {},
        },
        contentHash: 'test-hash',
        dailyRateNet: 15000,
        pdfKey: 'contracts/test/test.pdf',
        pdfGeneratedAt: new Date(),
      },
    });

    // Return rental2 with return data
    await prisma.rental.update({
      where: { id: rental2Id },
      data: {
        status: RentalStatus.RETURNED,
        returnMileage: 12500,
        returnData: { condition: 'good', notes: 'No damage' },
      },
    });
  }, 30000);

  afterAll(async () => {
    if (redis) {
      await redis.flushdb();
      await redis.quit();
    }
    if (app) {
      await app.close();
    }
  });

  // Helper: generate portal token and exchange for JWT
  async function getPortalJwt(forCustomerId: string): Promise<string> {
    const portalUrl = await portalService.generatePortalToken(forCustomerId);
    const urlObj = new URL(portalUrl);
    const rawToken = urlObj.searchParams.get('token')!;

    const res = await request(app.getHttpServer())
      .post('/portal/auth/exchange')
      .send({ token: rawToken, customerId: forCustomerId })
      .expect(200);

    return res.body.accessToken;
  }

  // PORTAL-01: Magic link authentication
  describe('POST /portal/auth/exchange', () => {
    it('should exchange valid token for JWT', async () => {
      const portalUrl = await portalService.generatePortalToken(customerId);
      const urlObj = new URL(portalUrl);
      const rawToken = urlObj.searchParams.get('token')!;

      const res = await request(app.getHttpServer())
        .post('/portal/auth/exchange')
        .send({ token: rawToken, customerId })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(typeof res.body.accessToken).toBe('string');
    });

    it('should reject expired token', async () => {
      // Generate token then manually expire it
      const portalUrl = await portalService.generatePortalToken(customerId);
      const urlObj = new URL(portalUrl);
      const rawToken = urlObj.searchParams.get('token')!;

      // Set expiration to the past
      await prisma.customer.update({
        where: { id: customerId },
        data: { portalTokenExpiresAt: new Date(Date.now() - 1000) },
      });

      const res = await request(app.getHttpServer())
        .post('/portal/auth/exchange')
        .send({ token: rawToken, customerId })
        .expect(401);

      expect(res.body.message).toContain('wygasl');
    });

    it('should reject invalid token', async () => {
      // Ensure customer has a valid (non-expired) portal token
      await portalService.generatePortalToken(customerId);

      await request(app.getHttpServer())
        .post('/portal/auth/exchange')
        .send({ token: 'totally-invalid-token', customerId })
        .expect(401);
    });

    it('should reject non-existent customer', async () => {
      await request(app.getHttpServer())
        .post('/portal/auth/exchange')
        .send({
          token: 'some-token',
          customerId: '00000000-0000-4000-a000-000000000099',
        })
        .expect(401);
    });

    it('should return JWT with portal type claim', async () => {
      const jwt = await getPortalJwt(customerId);
      // Decode JWT payload
      const payload = JSON.parse(
        Buffer.from(jwt.split('.')[1], 'base64').toString(),
      );
      expect(payload.type).toBe('portal');
      expect(payload.sub).toBe(customerId);
    });
  });

  // PORTAL-02: Portal data access
  describe('GET /portal/rentals', () => {
    it('should return all rentals for authenticated customer', async () => {
      const jwt = await getPortalJwt(customerId);

      const res = await request(app.getHttpServer())
        .get('/portal/rentals')
        .set('Authorization', `Bearer ${jwt}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    it('should include vehicle info in response', async () => {
      const jwt = await getPortalJwt(customerId);

      const res = await request(app.getHttpServer())
        .get('/portal/rentals')
        .set('Authorization', `Bearer ${jwt}`)
        .expect(200);

      const rental = res.body.find((r: any) => r.id === rentalId);
      expect(rental.vehicleMake).toBe('Toyota');
      expect(rental.vehicleModel).toBe('Corolla');
      expect(rental.vehicleRegistration).toBe('CT 12345');
    });

    it('should include contract info when available', async () => {
      const jwt = await getPortalJwt(customerId);

      const res = await request(app.getHttpServer())
        .get('/portal/rentals')
        .set('Authorization', `Bearer ${jwt}`)
        .expect(200);

      const rental = res.body.find((r: any) => r.id === rentalId);
      expect(rental.contractNumber).toBe('KITEK/2026/0301/0099');
      expect(rental.contractPdfUrl).toBe('https://mock-presigned-url');
    });

    it('should reject requests without portal token', async () => {
      await request(app.getHttpServer())
        .get('/portal/rentals')
        .expect(401);
    });

    it('should not expose PII', async () => {
      const jwt = await getPortalJwt(customerId);

      const res = await request(app.getHttpServer())
        .get('/portal/rentals')
        .set('Authorization', `Bearer ${jwt}`)
        .expect(200);

      const body = JSON.stringify(res.body);
      expect(body).not.toContain('44051401359'); // pesel
      expect(body).not.toContain('ABC123456'); // idNumber
      expect(body).not.toContain('DL000111'); // licenseNumber
    });
  });

  describe('GET /portal/rentals/:id', () => {
    it('should return rental detail with contract PDF URL', async () => {
      const jwt = await getPortalJwt(customerId);

      const res = await request(app.getHttpServer())
        .get(`/portal/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${jwt}`)
        .expect(200);

      expect(res.body.id).toBe(rentalId);
      expect(res.body.vehicleMake).toBe('Toyota');
      expect(res.body.contractPdfUrl).toBe('https://mock-presigned-url');
    });

    it('should return 404 for rental belonging to different customer', async () => {
      const jwt = await getPortalJwt(customerId);

      await request(app.getHttpServer())
        .get(`/portal/rentals/${otherCustomerRentalId}`)
        .set('Authorization', `Bearer ${jwt}`)
        .expect(404);
    });

    it('should include return inspection summary if returned', async () => {
      const jwt = await getPortalJwt(customerId);

      const res = await request(app.getHttpServer())
        .get(`/portal/rentals/${rental2Id}`)
        .set('Authorization', `Bearer ${jwt}`)
        .expect(200);

      expect(res.body.returnMileage).toBe(12500);
      expect(res.body.returnData).toEqual({
        condition: 'good',
        notes: 'No damage',
      });
    });
  });
});
