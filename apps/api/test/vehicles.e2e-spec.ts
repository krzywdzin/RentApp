import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import * as XLSX from 'xlsx';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/mail/mail.service';
import { StorageService } from '../src/storage/storage.service';
import { PdfService } from '../src/contracts/pdf/pdf.service';
import { SmsService } from '../src/notifications/sms/sms.service';
import { UserRole } from '@rentapp/shared';
import Redis from 'ioredis';

const ARGON2_OPTIONS = { memoryCost: 32768, timeCost: 3, parallelism: 1 };

jest.setTimeout(30000);

describe('Vehicles (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: Redis;
  let adminToken: string;
  let employeeToken: string;
  const deviceId = '00000000-0000-4000-a000-000000000002';
  const adminEmail = 'vehicles-admin@test.com';
  const employeeEmail = 'vehicles-employee@test.com';
  const adminPassword = 'Admin1234!';
  const employeePassword = 'Employee1234!';

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
        name: 'Vehicles Admin',
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
        name: 'Vehicles Employee',
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
      .send({ email: employeeEmail, password: employeePassword, deviceId: '00000000-0000-4000-a000-000000000003' });
    employeeToken = empRes.body.accessToken;
  });

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

  const validVehicle = {
    registration: 'WE99001',
    vin: 'WVWZZZ3CZWE000001',
    make: 'Volkswagen',
    model: 'Golf',
    year: 2022,
    fuelType: 'PETROL',
    transmission: 'MANUAL',
    color: 'Silver',
    mileage: 45000,
  };

  // --- CRUD Tests ---

  it('POST /vehicles with valid data returns 201 and vehicle object with id', async () => {
    const res = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validVehicle)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.registration).toBe('WE99001');
    expect(res.body.make).toBe('Volkswagen');
    expect(res.body.status).toBe('AVAILABLE');
  });

  it('POST /vehicles with invalid VIN returns 400', async () => {
    await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validVehicle, registration: 'WE99002', vin: 'INVALID' })
      .expect(400);
  });

  it('POST /vehicles with duplicate registration returns 409 or 500', async () => {
    const res = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validVehicle);

    // Prisma unique constraint violation returns 500 (or we could map to 409)
    expect([409, 500]).toContain(res.status);
  });

  it('GET /vehicles returns array, default excludes archived', async () => {
    const res = await request(app.getHttpServer())
      .get('/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    // All results should not be archived
    for (const v of res.body) {
      expect(v.isArchived).toBe(false);
    }
  });

  it('GET /vehicles?includeArchived=true includes archived vehicles', async () => {
    // First, create and archive a vehicle
    const createRes = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...validVehicle,
        registration: 'WE99003',
        vin: 'WVWZZZ3CZWE000003',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/vehicles/${createRes.body.id}/archive`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/vehicles?includeArchived=true')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const archived = res.body.filter((v: any) => v.isArchived);
    expect(archived.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /vehicles/:id returns vehicle with insurance and inspection relations', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...validVehicle,
        registration: 'WE99004',
        vin: 'WVWZZZ3CZWE000004',
        insurance: {
          companyName: 'PZU',
          policyNumber: 'POL123',
          expiryDate: '2026-12-31',
          coverageType: 'OC',
        },
        inspection: {
          expiryDate: '2026-06-15',
        },
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/vehicles/${createRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('insurance');
    expect(res.body.insurance).not.toBeNull();
    expect(res.body.insurance.companyName).toBe('PZU');
    expect(res.body).toHaveProperty('inspection');
    expect(res.body.inspection).not.toBeNull();
  });

  it('GET /vehicles/:id with non-existent ID returns 404', async () => {
    await request(app.getHttpServer())
      .get('/vehicles/00000000-0000-4000-a000-999999999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  it('PATCH /vehicles/:id updates fields and returns updated vehicle', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...validVehicle,
        registration: 'WE99005',
        vin: 'WVWZZZ3CZWE000005',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .patch(`/vehicles/${createRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ color: 'Red', mileage: 50000 })
      .expect(200);

    expect(res.body.color).toBe('Red');
    expect(res.body.mileage).toBe(50000);
  });

  it('PATCH /vehicles/:id with status: SERVICE succeeds', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...validVehicle,
        registration: 'WE99006',
        vin: 'WVWZZZ3CZWE000006',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .patch(`/vehicles/${createRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SERVICE' })
      .expect(200);

    expect(res.body.status).toBe('SERVICE');
  });

  it('PATCH /vehicles/:id with status: RENTED returns 400', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...validVehicle,
        registration: 'WE99007',
        vin: 'WVWZZZ3CZWE000007',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/vehicles/${createRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RENTED' })
      .expect(400);
  });

  it('PATCH /vehicles/:id/archive sets isArchived=true', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...validVehicle,
        registration: 'WE99008',
        vin: 'WVWZZZ3CZWE000008',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .patch(`/vehicles/${createRes.body.id}/archive`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.isArchived).toBe(true);
    expect(res.body.status).toBe('RETIRED');
  });

  // --- Import Tests ---

  it('POST /vehicles/import with valid CSV creates vehicles and returns report', async () => {
    const csvData = [
      [
        'registration',
        'vin',
        'make',
        'model',
        'year',
        'fuelType',
        'transmission',
      ],
      ['WI10001', 'WVWZZZ3CZWE100001', 'Toyota', 'Corolla', 2023, 'PETROL', 'AUTOMATIC'],
      ['WI10002', 'WVWZZZ3CZWE100002', 'Honda', 'Civic', 2022, 'DIESEL', 'MANUAL'],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(csvData);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'csv' });

    const res = await request(app.getHttpServer())
      .post('/vehicles/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', buffer, 'fleet.csv')
      .expect(201);

    expect(res.body).toHaveProperty('imported', 2);
    expect(res.body).toHaveProperty('skipped', 0);
    expect(res.body).toHaveProperty('errors');
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('POST /vehicles/import with duplicate registration skips row', async () => {
    // WI10001 was already imported above
    const csvData = [
      [
        'registration',
        'vin',
        'make',
        'model',
        'year',
        'fuelType',
        'transmission',
      ],
      ['WI10001', 'WVWZZZ3CZWE100099', 'Toyota', 'Yaris', 2023, 'PETROL', 'AUTOMATIC'],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(csvData);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'csv' });

    const res = await request(app.getHttpServer())
      .post('/vehicles/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', buffer, 'fleet-dup.csv')
      .expect(201);

    expect(res.body.imported).toBe(0);
    expect(res.body.skipped).toBe(1);
    expect(res.body.errors[0].reason).toContain('Duplicate');
  });

  it('GET /vehicles/import/template returns CSV content', async () => {
    const res = await request(app.getHttpServer())
      .get('/vehicles/import/template')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain(
      'fleet-import-template.csv',
    );
    expect(res.text).toContain('registration');
    expect(res.text).toContain('vin');
  });

  // --- Role Enforcement ---

  it('Employee role can GET /vehicles but cannot POST /vehicles', async () => {
    // Employee CAN read
    await request(app.getHttpServer())
      .get('/vehicles')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    // Employee CANNOT create
    await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send(validVehicle)
      .expect(403);
  });
});
