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

describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: Redis;
  let adminToken: string;
  let employeeToken: string;
  let customerToken: string;
  let adminUserId: string;
  let inAppNotifId: string;

  const adminEmail = 'notif-admin@test.com';
  const adminPassword = 'NotifAdmin1!';
  const employeeEmail = 'notif-employee@test.com';
  const employeePassword = 'NotifEmployee1!';
  const customerEmail = 'notif-customer@test.com';
  const customerPassword = 'NotifCustomer1!';
  const deviceId = '00000000-0000-4000-a000-000000000050';

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
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Notif Admin',
        role: UserRole.ADMIN,
        passwordHash: adminHash,
        isActive: true,
      },
    });
    adminUserId = adminUser.id;

    // Seed employee
    const empHash = await argon2.hash(employeePassword, ARGON2_OPTIONS);
    await prisma.user.create({
      data: {
        email: employeeEmail,
        name: 'Notif Employee',
        role: UserRole.EMPLOYEE,
        passwordHash: empHash,
        isActive: true,
      },
    });

    // Seed customer role user
    const custHash = await argon2.hash(customerPassword, ARGON2_OPTIONS);
    await prisma.user.create({
      data: {
        email: customerEmail,
        name: 'Notif Customer',
        role: UserRole.CUSTOMER,
        passwordHash: custHash,
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
      .send({ email: employeeEmail, password: employeePassword, deviceId: deviceId.replace(/0050$/, '0051') });
    employeeToken = empRes.body.accessToken;

    const custRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: customerEmail, password: customerPassword, deviceId: deviceId.replace(/0050$/, '0052') });
    customerToken = custRes.body.accessToken;

    // Create in-app notifications for admin
    const n1 = await prisma.inAppNotification.create({
      data: {
        userId: adminUserId,
        title: 'Test alert 1',
        body: 'Body 1',
        type: 'INSURANCE_EXPIRY',
        isRead: false,
      },
    });
    inAppNotifId = n1.id;

    await prisma.inAppNotification.create({
      data: {
        userId: adminUserId,
        title: 'Test alert 2',
        body: 'Body 2',
        type: 'INSPECTION_EXPIRY',
        isRead: false,
      },
    });

    // Create a notification log entry
    await prisma.notification.create({
      data: {
        type: 'RETURN_REMINDER',
        channel: 'SMS',
        recipientPhone: '+48605123456',
        status: 'SENT',
        message: 'Test message',
        relatedEntityType: 'Rental',
        relatedEntityId: 'test-rental',
        scheduledFor: new Date(),
        sentAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.inAppNotification.deleteMany({});
    await prisma.notification.deleteMany({});
    await redis.flushdb();
    await redis.quit();
    await app.close();
  });

  it('GET /notifications/in-app returns paginated list for authenticated user', async () => {
    const res = await request(app.getHttpServer())
      .get('/notifications/in-app')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /notifications/in-app/unread-count returns count', async () => {
    const res = await request(app.getHttpServer())
      .get('/notifications/in-app/unread-count')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('count');
    expect(res.body.count).toBeGreaterThanOrEqual(2);
  });

  it('PATCH /notifications/in-app/:id/read marks as read', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/notifications/in-app/${inAppNotifId}/read`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.isRead).toBe(true);
    expect(res.body.readAt).toBeDefined();
  });

  it('PATCH /notifications/in-app/read-all marks all as read', async () => {
    // Create fresh unread
    await prisma.inAppNotification.create({
      data: {
        userId: adminUserId,
        title: 'Unread test',
        body: 'Body',
        type: 'OVERDUE',
        isRead: false,
      },
    });

    await request(app.getHttpServer())
      .patch('/notifications/in-app/read-all')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const count = await prisma.inAppNotification.count({
      where: { userId: adminUserId, isRead: false },
    });
    expect(count).toBe(0);
  });

  it('GET /notifications/in-app rejects CUSTOMER role', async () => {
    await request(app.getHttpServer())
      .get('/notifications/in-app')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
  });

  it('GET /notifications/log returns notification history for admin', async () => {
    const res = await request(app.getHttpServer())
      .get('/notifications/log')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
