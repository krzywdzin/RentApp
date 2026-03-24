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
import { UserRole } from '@rentapp/shared';
import Redis from 'ioredis';

const ARGON2_OPTIONS = { memoryCost: 32768, timeCost: 3, parallelism: 1 };

jest.setTimeout(30000);

describe('Alerts (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: Redis;
  let adminToken: string;
  let employeeToken: string;

  const adminEmail = 'alert-admin@test.com';
  const adminPassword = 'AlertAdmin1!';
  const employeeEmail = 'alert-employee@test.com';
  const employeePassword = 'AlertEmployee1!';
  const deviceId = '00000000-0000-4000-a000-000000000060';

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
    getBuffer: jest.fn().mockResolvedValue(Buffer.from('mock')),
    getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://test-url/mock'),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  const mockPdfService = {
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    generateContractPdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf')),
    generateAnnexPdf: jest.fn().mockResolvedValue(Buffer.from('mock-annex-pdf')),
  };

  const mockSmsService = {
    normalizePhone: jest.fn().mockImplementation((p: string) => p.replace(/[+\s-]/g, '')),
    send: jest.fn().mockResolvedValue('sms-123'),
  };

  beforeAll(async () => {
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
      .useValue(mockSmsService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    redis = new Redis(process.env.REDIS_URL!);
    await redis.flushdb();

    // Clean up
    await prisma.inAppNotification.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.alertConfig.deleteMany({});
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
        name: 'Alert Admin',
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
        name: 'Alert Employee',
        role: UserRole.EMPLOYEE,
        passwordHash: empHash,
        isActive: true,
      },
    });

    // Login
    const adminRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword, deviceId });
    adminToken = adminRes.body.accessToken;

    const empRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: employeeEmail,
        password: employeePassword,
        deviceId: deviceId.replace(/0060$/, '0061'),
      });
    employeeToken = empRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.alertConfig.deleteMany({});
    await redis.flushdb();
    await redis.quit();
    await app.close();
  });

  it('GET /alert-configs returns all configs for admin', async () => {
    const res = await request(app.getHttpServer())
      .get('/alert-configs')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0]).toHaveProperty('alertType');
    expect(res.body[0]).toHaveProperty('enabled');
  });

  it('PATCH /alert-configs/:alertType updates config', async () => {
    const res = await request(app.getHttpServer())
      .patch('/alert-configs/RETURN_REMINDER')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ enabled: false })
      .expect(200);

    expect(res.body.alertType).toBe('RETURN_REMINDER');
    expect(res.body.enabled).toBe(false);

    // Restore
    await request(app.getHttpServer())
      .patch('/alert-configs/RETURN_REMINDER')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ enabled: true });
  });

  it('PATCH /alert-configs/:alertType rejects non-admin', async () => {
    await request(app.getHttpServer())
      .patch('/alert-configs/RETURN_REMINDER')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ enabled: false })
      .expect(403);
  });

  it('PATCH /alert-configs/UNKNOWN returns 404', async () => {
    await request(app.getHttpServer())
      .patch('/alert-configs/UNKNOWN_TYPE')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ enabled: false })
      .expect(404);
  });

  it('GET /alert-configs rejects EMPLOYEE role', async () => {
    await request(app.getHttpServer())
      .get('/alert-configs')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(403);
  });
});
