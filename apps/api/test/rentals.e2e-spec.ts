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
import { UserRole, RentalStatus, VehicleStatus } from '@rentapp/shared';
import Redis from 'ioredis';

const ARGON2_OPTIONS = { memoryCost: 32768, timeCost: 3, parallelism: 1 };

// Valid PESEL for customer creation
const VALID_PESEL = '44051401359';

jest.setTimeout(30000);

describe('Rentals (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: Redis;
  let adminToken: string;
  let employeeToken: string;

  const adminEmail = 'rental-admin@test.com';
  const adminPassword = 'RentalAdmin1!';
  const employeeEmail = 'rental-employee@test.com';
  const employeePassword = 'RentalEmployee1!';
  const deviceId = '00000000-0000-4000-a000-000000000010';

  let vehicleId: string;
  let customerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue({
        sendSetupPasswordEmail: jest.fn(),
        sendResetPasswordEmail: jest.fn(),
      })
      .overrideProvider(StorageService)
      .useValue({
        upload: jest.fn().mockResolvedValue('mock-key'),
        getPresignedDownloadUrl: jest
          .fn()
          .mockResolvedValue('https://mock-presigned-url'),
        delete: jest.fn().mockResolvedValue(undefined),
        onModuleInit: jest.fn(),
      })
      .overrideProvider(PdfService)
      .useValue({ onModuleInit: jest.fn(), onModuleDestroy: jest.fn(), generateContractPdf: jest.fn(), generateAnnexPdf: jest.fn() })
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
        name: 'Rental Admin',
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
        name: 'Rental Employee',
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
        deviceId: '00000000-0000-4000-a000-000000000011',
      });
    employeeToken = empRes.body.accessToken;

    // Create a vehicle for rental tests
    const vRes = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        registration: 'RE12345',
        vin: 'WVWZZZ3CZWE200001',
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

    // Create a customer for rental tests
    const cRes = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Jan',
        lastName: 'Kowalski',
        phone: '+48123456789',
        email: 'jan-rental@example.com',
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

  // Helper to reset vehicle status between tests
  async function resetVehicleStatus(
    status: VehicleStatus = VehicleStatus.AVAILABLE,
  ) {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status },
    });
  }

  // --- CRUD ---

  describe('POST /rentals', () => {
    it('should create rental in DRAFT status', async () => {
      const res = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleId,
          customerId,
          startDate: '2026-06-01T00:00:00Z',
          endDate: '2026-06-06T00:00:00Z',
          dailyRateNet: 10000,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe(RentalStatus.DRAFT);
      expect(res.body.dailyRateNet).toBe(10000);
      expect(res.body.totalPriceNet).toBe(50000);
    });

    it('should create rental in ACTIVE status with handoverData', async () => {
      await resetVehicleStatus();

      const res = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleId,
          customerId,
          startDate: '2026-07-01T00:00:00Z',
          endDate: '2026-07-06T00:00:00Z',
          dailyRateNet: 12000,
          status: RentalStatus.ACTIVE,
          handoverData: { mileage: 50000 },
        })
        .expect(201);

      expect(res.body.status).toBe(RentalStatus.ACTIVE);
      expect(res.body.handoverData).toHaveProperty('mileage', 50000);
    }, 15000);

    it('should return 409 on overlap without override', async () => {
      // The rental from previous test overlaps with this one
      const res = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleId,
          customerId,
          startDate: '2026-07-03T00:00:00Z',
          endDate: '2026-07-08T00:00:00Z',
          dailyRateNet: 10000,
        })
        .expect(409);

      expect(res.body).toHaveProperty('conflicts');
      expect(res.body.conflicts.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow override on overlap', async () => {
      const res = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleId,
          customerId,
          startDate: '2026-07-03T00:00:00Z',
          endDate: '2026-07-08T00:00:00Z',
          dailyRateNet: 10000,
          overrideConflict: true,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.overrodeConflict).toBe(true);
    });
  });

  describe('GET /rentals', () => {
    it('should list rentals', async () => {
      const res = await request(app.getHttpServer())
        .get('/rentals')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /rentals/calendar', () => {
    it('should return vehicle-grouped calendar', async () => {
      const res = await request(app.getHttpServer())
        .get('/rentals/calendar')
        .query({ from: '2026-06-01T00:00:00Z', to: '2026-07-31T00:00:00Z' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('vehicles');
      expect(res.body).toHaveProperty('period');
      expect(Array.isArray(res.body.vehicles)).toBe(true);
      // Our test vehicle should be included
      const testVehicle = res.body.vehicles.find(
        (v: any) => v.id === vehicleId,
      );
      expect(testVehicle).toBeDefined();
      expect(testVehicle.rentals.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /rentals/:id', () => {
    it('should return rental by id with vehicle and customer', async () => {
      // Get any rental from the list
      const listRes = await request(app.getHttpServer())
        .get('/rentals')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const rentalId = listRes.body[0].id;

      const res = await request(app.getHttpServer())
        .get(`/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(rentalId);
      expect(res.body).toHaveProperty('vehicle');
      expect(res.body).toHaveProperty('customer');
    });
  });

  // --- State transitions ---

  describe('PATCH /rentals/:id/activate', () => {
    let draftRentalId: string;

    beforeAll(async () => {
      // Clean and create a fresh DRAFT rental for activation tests
      await resetVehicleStatus();

      const res = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleId,
          customerId,
          startDate: '2026-08-01T00:00:00Z',
          endDate: '2026-08-06T00:00:00Z',
          dailyRateNet: 10000,
          overrideConflict: true,
        })
        .expect(201);

      draftRentalId = res.body.id;
    });

    it('should activate draft rental', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/rentals/${draftRentalId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ handoverData: { mileage: 50000 } })
        .expect(200);

      expect(res.body.status).toBe(RentalStatus.ACTIVE);
    });

    it('should reject invalid transition (activate already active)', async () => {
      await request(app.getHttpServer())
        .patch(`/rentals/${draftRentalId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ handoverData: { mileage: 50000 } })
        .expect(400);
    });
  });

  describe('PATCH /rentals/:id/return', () => {
    let activeRentalId: string;

    beforeAll(async () => {
      await resetVehicleStatus();

      // Create and immediately activate a rental
      const createRes = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleId,
          customerId,
          startDate: '2026-09-01T00:00:00Z',
          endDate: '2026-09-06T00:00:00Z',
          dailyRateNet: 10000,
          status: RentalStatus.ACTIVE,
          handoverData: { mileage: 50000 },
          overrideConflict: true,
        })
        .expect(201);

      activeRentalId = createRes.body.id;
    }, 15000);

    it('should process return with mileage', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/rentals/${activeRentalId}/return`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ returnMileage: 55000 })
        .expect(200);

      expect(res.body.status).toBe(RentalStatus.RETURNED);
      expect(res.body.returnMileage).toBe(55000);
    }, 15000);

    it('should include handover data in return response for comparison', async () => {
      // Create another active rental with handoverData
      await resetVehicleStatus();

      const createRes = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleId,
          customerId,
          startDate: '2026-09-10T00:00:00Z',
          endDate: '2026-09-15T00:00:00Z',
          dailyRateNet: 10000,
          status: RentalStatus.ACTIVE,
          handoverData: {
            mileage: 50000,
            areas: [{ area: 'front', condition: 'good' }],
          },
          overrideConflict: true,
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/rentals/${createRes.body.id}/return`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          returnMileage: 55000,
          returnData: {
            mileage: 55000,
            areas: [{ area: 'front', condition: 'minor_damage' }],
          },
        })
        .expect(200);

      expect(res.body.handoverData).toBeDefined();
      expect(res.body.handoverData.mileage).toBe(50000);
      expect(res.body.returnData).toBeDefined();
      expect(res.body.returnData.mileage).toBe(55000);
    }, 15000);
  });

  describe('PATCH /rentals/:id/extend', () => {
    let activeRentalId: string;

    beforeAll(async () => {
      await resetVehicleStatus();

      const createRes = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleId,
          customerId,
          startDate: '2026-10-01T00:00:00Z',
          endDate: '2026-10-06T00:00:00Z',
          dailyRateNet: 10000,
          status: RentalStatus.ACTIVE,
          handoverData: { mileage: 50000 },
          overrideConflict: true,
        })
        .expect(201);

      activeRentalId = createRes.body.id;
    }, 15000);

    it('should extend rental (admin)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/rentals/${activeRentalId}/extend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newEndDate: '2026-10-10T00:00:00Z' })
        .expect(200);

      expect(res.body.status).toBe(RentalStatus.EXTENDED);
      // 9 days at 10000 = 90000
      expect(res.body.totalPriceNet).toBe(90000);
    });

    it('should reject extend (employee)', async () => {
      await request(app.getHttpServer())
        .patch(`/rentals/${activeRentalId}/extend`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ newEndDate: '2026-10-15T00:00:00Z' })
        .expect(403);
    });
  });

  describe('PATCH /rentals/:id/rollback', () => {
    let returnedRentalId: string;

    beforeAll(async () => {
      await resetVehicleStatus();

      // Create ACTIVE rental, then return it
      const createRes = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleId,
          customerId,
          startDate: '2026-11-01T00:00:00Z',
          endDate: '2026-11-06T00:00:00Z',
          dailyRateNet: 10000,
          status: RentalStatus.ACTIVE,
          handoverData: { mileage: 50000 },
          overrideConflict: true,
        })
        .expect(201);

      returnedRentalId = createRes.body.id;

      // Return it
      await request(app.getHttpServer())
        .patch(`/rentals/${returnedRentalId}/return`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ returnMileage: 55000 })
        .expect(200);
    }, 20000);

    it('should rollback status (admin)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/rentals/${returnedRentalId}/rollback`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetStatus: RentalStatus.ACTIVE,
          reason: 'Return was premature',
        })
        .expect(200);

      expect(res.body.status).toBe(RentalStatus.ACTIVE);
    });

    it('should reject rollback (employee)', async () => {
      await request(app.getHttpServer())
        .patch(`/rentals/${returnedRentalId}/rollback`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          targetStatus: RentalStatus.DRAFT,
          reason: 'Should not work',
        })
        .expect(403);
    });
  });
});
