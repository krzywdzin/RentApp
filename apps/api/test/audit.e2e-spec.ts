import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditService } from '../src/audit/audit.service';
import { MailService } from '../src/mail/mail.service';
import { StorageService } from '../src/storage/storage.service';
import { PdfService } from '../src/contracts/pdf/pdf.service';
import { SmsService } from '../src/notifications/sms/sms.service';
import { UserRole } from '@rentapp/shared';
import Redis from 'ioredis';

const ARGON2_OPTIONS = { memoryCost: 32768, timeCost: 3, parallelism: 1 };

jest.setTimeout(30000);

describe('Audit (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let auditService: AuditService;
  let redis: Redis;
  let adminToken: string;
  let employeeToken: string;
  let adminId: string;

  const adminEmail = 'audit-admin@test.com';
  const adminPassword = 'AuditAdmin1!';
  const employeeEmail = 'audit-employee@test.com';
  const employeePassword = 'AuditEmployee1!';
  const deviceId = '00000000-0000-4000-a000-000000000002';

  async function loginAs(
    email: string,
    password: string,
  ): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password, deviceId })
      .expect(201);
    return res.body.accessToken;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue({ sendSetupPasswordEmail: jest.fn(), sendResetPasswordEmail: jest.fn() })
      .overrideProvider(StorageService)
      .useValue({ onModuleInit: jest.fn(), upload: jest.fn(), getPresignedDownloadUrl: jest.fn(), delete: jest.fn() })
      .overrideProvider(PdfService)
      .useValue({ onModuleInit: jest.fn(), onModuleDestroy: jest.fn(), generateContractPdf: jest.fn(), generateAnnexPdf: jest.fn() })
      .overrideProvider(SmsService)
      .useValue({ normalizePhone: jest.fn((p: string) => p), send: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);
    auditService = app.get(AuditService);
    redis = new Redis(process.env.REDIS_URL!);

    // Force fresh DB connection to avoid stale cached plans after schema reset
    try { await prisma.$executeRawUnsafe('DEALLOCATE ALL'); } catch {}
    await prisma.$disconnect();
    await prisma.$connect();

    // Clean up from previous runs (full dependency order)
    await redis.flushdb();
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
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Audit Admin',
        role: UserRole.ADMIN,
        passwordHash: adminHash,
        isActive: true,
      },
    });
    adminId = admin.id;

    // Seed employee user
    const employeeHash = await argon2.hash(employeePassword, ARGON2_OPTIONS);
    await prisma.user.create({
      data: {
        email: employeeEmail,
        name: 'Audit Employee',
        role: UserRole.EMPLOYEE,
        passwordHash: employeeHash,
        isActive: true,
      },
    });

    // Login both users
    adminToken = await loginAs(adminEmail, adminPassword);
    employeeToken = await loginAs(employeeEmail, employeePassword);
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

  describe('GET /audit', () => {
    it('GET /audit as ADMIN returns 200 with paginated structure', async () => {
      const res = await request(app.getHttpServer())
        .get('/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('limit');
      expect(res.body).toHaveProperty('offset');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /audit as EMPLOYEE returns 403', async () => {
      await request(app.getHttpServer())
        .get('/audit')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);
    });

    it('GET /audit without auth returns 401', async () => {
      await request(app.getHttpServer())
        .get('/audit')
        .expect(401);
    });

    it('GET /audit filters by entityType', async () => {
      // Create a user via POST /users to trigger audit interceptor
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'audit-filter-test@test.com',
          name: 'Filter Test User',
          role: 'EMPLOYEE',
        })
        .expect(201);

      // Delay for async audit log write (longer for cloud DB latency)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const res = await request(app.getHttpServer())
        .get('/audit?entityType=Users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      for (const entry of res.body.data) {
        expect(entry.entityType).toBe('Users');
      }
    });

    it('GET /audit filters by actorId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/audit?actorId=${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      for (const entry of res.body.data) {
        expect(entry.actorId).toBe(adminId);
      }
    });

    it('GET /audit respects limit and offset', async () => {
      const res = await request(app.getHttpServer())
        .get('/audit?limit=1&offset=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeLessThanOrEqual(1);
      expect(res.body.limit).toBe(1);
      expect(res.body.offset).toBe(0);
    });

    it('GET /audit does NOT create an audit log entry', async () => {
      const countBefore = await prisma.auditLog.count();

      await request(app.getHttpServer())
        .get('/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Small delay to ensure any async audit write would have completed
      await new Promise((resolve) => setTimeout(resolve, 200));

      const countAfter = await prisma.auditLog.count();
      expect(countAfter).toBe(countBefore);
    });
  });

  describe('AuditService contract', () => {
    it('AuditLog has no update or delete methods exposed', () => {
      expect((auditService as any).update).toBeUndefined();
      expect((auditService as any).delete).toBeUndefined();
      expect((auditService as any).remove).toBeUndefined();
      expect((auditService as any).destroy).toBeUndefined();
    });
  });
});
