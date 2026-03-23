import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/mail/mail.service';
import { StorageService } from '../src/storage/storage.service';
import { UserRole } from '@rentapp/shared';
import Redis from 'ioredis';

const ARGON2_OPTIONS = { memoryCost: 32768, timeCost: 3, parallelism: 1 };

// Valid PESEL numbers (checksum-verified)
const VALID_PESEL = '44051401359';
const VALID_PESEL_2 = '92071314764';
const INVALID_PESEL = '12345678901'; // Bad checksum

describe('Customers (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: Redis;
  let adminToken: string;
  let employeeToken: string;

  const adminEmail = 'cust-admin@test.com';
  const adminPassword = 'CustAdmin1!';
  const employeeEmail = 'cust-employee@test.com';
  const employeePassword = 'CustEmployee1!';
  const deviceId = '00000000-0000-4000-a000-000000000003';

  async function loginAs(email: string, password: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password, deviceId });
    return res.body.accessToken;
  }

  const validCustomerDto = {
    firstName: 'Jan',
    lastName: 'Kowalski',
    phone: '+48123456789',
    email: 'jan@example.com',
    address: 'ul. Testowa 1, Warszawa',
    pesel: VALID_PESEL,
    idNumber: 'ABC123456',
    licenseNumber: 'DRV789012',
    idIssuedBy: 'Urzad Miasta Warszawa',
    idIssuedDate: '2020-01-15',
    licenseCategory: 'B',
    licenseIssuedBy: 'Starostwo Powiatowe',
  };

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
        onModuleInit: jest.fn(),
        upload: jest.fn(),
        getPresignedDownloadUrl: jest.fn(),
        delete: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);
    redis = new Redis(process.env.REDIS_URL!);
    await redis.flushdb();

    // Clean up from previous runs
    await prisma.auditLog.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.user.deleteMany({});

    // Seed admin user
    const adminHash = await argon2.hash(adminPassword, ARGON2_OPTIONS);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Customer Test Admin',
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
        name: 'Customer Test Employee',
        role: UserRole.EMPLOYEE,
        passwordHash: empHash,
        isActive: true,
      },
    });

    adminToken = await loginAs(adminEmail, adminPassword);
    employeeToken = await loginAs(employeeEmail, employeePassword);
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.user.deleteMany({});
    await redis.flushdb();
    await redis.quit();
    await app.close();
  });

  // Reset customers between tests
  beforeEach(async () => {
    await prisma.customer.deleteMany({});
  });

  // --- Create ---

  it('POST /customers with valid data returns 201 with decrypted PII in response', async () => {
    const res = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCustomerDto)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.firstName).toBe('Jan');
    expect(res.body.lastName).toBe('Kowalski');
    expect(res.body.pesel).toBe(VALID_PESEL);
    expect(res.body.idNumber).toBe('ABC123456');
    expect(res.body.licenseNumber).toBe('DRV789012');
    expect(res.body.isArchived).toBe(false);
  });

  it('POST /customers with invalid PESEL (bad checksum) returns 400', async () => {
    await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validCustomerDto, pesel: INVALID_PESEL })
      .expect(400);
  });

  it('POST /customers with duplicate PESEL returns existing customer (deduplication)', async () => {
    // Create first
    const first = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCustomerDto)
      .expect(201);

    // Create second with same PESEL
    const second = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validCustomerDto, firstName: 'Different' })
      .expect(201);

    // Should return the same customer
    expect(second.body.id).toBe(first.body.id);
    expect(second.body.firstName).toBe('Jan'); // Original name, not "Different"
  });

  // --- Read ---

  it('GET /customers returns array with decrypted PII', async () => {
    await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCustomerDto)
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].pesel).toBe(VALID_PESEL);
  });

  it('GET /customers/:id returns single customer with all fields decrypted', async () => {
    const created = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCustomerDto)
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/customers/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.pesel).toBe(VALID_PESEL);
    expect(res.body.idNumber).toBe('ABC123456');
    expect(res.body.licenseNumber).toBe('DRV789012');
    expect(res.body.idIssuedBy).toBe('Urzad Miasta Warszawa');
    expect(res.body.licenseCategory).toBe('B');
  });

  it('GET /customers/:id with non-existent ID returns 404', async () => {
    await request(app.getHttpServer())
      .get('/customers/00000000-0000-4000-a000-000000000099')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  // --- Update ---

  it('PATCH /customers/:id updates non-sensitive fields', async () => {
    const created = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCustomerDto)
      .expect(201);

    const res = await request(app.getHttpServer())
      .patch(`/customers/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Janusz', phone: '+48999888777' })
      .expect(200);

    expect(res.body.firstName).toBe('Janusz');
    expect(res.body.phone).toBe('+48999888777');
  });

  // --- Archive ---

  it('PATCH /customers/:id/archive sets isArchived=true', async () => {
    const created = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCustomerDto)
      .expect(201);

    const res = await request(app.getHttpServer())
      .patch(`/customers/${created.body.id}/archive`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.isArchived).toBe(true);
  });

  // --- Search ---

  it('GET /customers/search?pesel=... finds customer by PESEL HMAC', async () => {
    await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCustomerDto)
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/customers/search?pesel=${VALID_PESEL}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.length).toBe(1);
    expect(res.body[0].firstName).toBe('Jan');
    expect(res.body[0].lastName).toBe('Kowalski');
  });

  it('GET /customers/search?lastName=Kowalski finds customer case-insensitively', async () => {
    await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCustomerDto)
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/customers/search?lastName=kowalski')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.length).toBe(1);
    expect(res.body[0].lastName).toBe('Kowalski');
  });

  it('GET /customers/search?phone=+48123456789 finds customer by exact phone', async () => {
    await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCustomerDto)
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/customers/search?phone=%2B48123456789')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.length).toBe(1);
    expect(res.body[0].phone).toBe('+48123456789');
  });

  it('GET /customers/search with no params returns 400', async () => {
    await request(app.getHttpServer())
      .get('/customers/search')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
  });

  it('search results do NOT contain pesel, idNumber, or licenseNumber fields', async () => {
    await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCustomerDto)
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/customers/search?pesel=${VALID_PESEL}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.length).toBe(1);
    expect(res.body[0]).not.toHaveProperty('pesel');
    expect(res.body[0]).not.toHaveProperty('idNumber');
    expect(res.body[0]).not.toHaveProperty('licenseNumber');
    expect(res.body[0]).not.toHaveProperty('peselEncrypted');
    expect(res.body[0]).not.toHaveProperty('idNumberEncrypted');
    expect(res.body[0]).not.toHaveProperty('licenseNumEncrypted');
  });

  // --- Role-based access ---

  it('Employee can create and search customers', async () => {
    const created = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ ...validCustomerDto, pesel: VALID_PESEL_2, lastName: 'Nowak' })
      .expect(201);

    expect(created.body).toHaveProperty('id');

    const search = await request(app.getHttpServer())
      .get('/customers/search?lastName=Nowak')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(search.body.length).toBe(1);
    expect(search.body[0].lastName).toBe('Nowak');
  });

  // --- Encrypted storage verification ---

  it('encrypted storage: peselEncrypted is a JSON object with ciphertext/iv/tag, NOT plaintext', async () => {
    const created = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validCustomerDto)
      .expect(201);

    // Query the database directly to verify encrypted storage
    const raw = await prisma.customer.findUnique({
      where: { id: created.body.id },
    });

    expect(raw).toBeDefined();
    const peselEnc = raw!.peselEncrypted as any;
    expect(peselEnc).toHaveProperty('ciphertext');
    expect(peselEnc).toHaveProperty('iv');
    expect(peselEnc).toHaveProperty('tag');
    // Ciphertext must not be the plaintext PESEL
    expect(peselEnc.ciphertext).not.toBe(VALID_PESEL);

    const idEnc = raw!.idNumberEncrypted as any;
    expect(idEnc).toHaveProperty('ciphertext');
    expect(idEnc.ciphertext).not.toBe('ABC123456');

    const licEnc = raw!.licenseNumEncrypted as any;
    expect(licEnc).toHaveProperty('ciphertext');
    expect(licEnc.ciphertext).not.toBe('DRV789012');
  });
});
