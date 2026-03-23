import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/mail/mail.service';
import { AuthService } from '../src/auth/auth.service';
import { UserRole } from '@rentapp/shared';
import Redis from 'ioredis';

const ARGON2_OPTIONS = { memoryCost: 32768, timeCost: 3, parallelism: 1 };

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: Redis;
  let adminId: string;
  const deviceId = '00000000-0000-4000-a000-000000000001';
  const adminEmail = 'admin@test.com';
  const adminPassword = 'Admin1234!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue({ sendSetupPasswordEmail: jest.fn(), sendResetPasswordEmail: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);
    redis = new Redis(process.env.REDIS_URL!);

    // Flush all Redis keys from previous runs
    await redis.flushdb();

    // Clean up from previous runs
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});

    // Seed admin user with known password
    const passwordHash = await argon2.hash(adminPassword, ARGON2_OPTIONS);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Test Admin',
        role: UserRole.ADMIN,
        passwordHash,
        isActive: true,
      },
    });
    adminId = admin.id;
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});
    await redis.flushdb();
    await redis.quit();
    await app.close();
  });

  // Helper: login and get tokens
  async function loginAdmin() {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword, deviceId });
    return res.body;
  }

  // --- AUTH-01: Login ---

  it('POST /auth/login with valid credentials returns access + refresh tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword, deviceId })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('deviceId', deviceId);
    expect(typeof res.body.accessToken).toBe('string');
    expect(typeof res.body.refreshToken).toBe('string');
  });

  it('POST /auth/login with invalid credentials returns 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: 'WrongPassword1!', deviceId })
      .expect(401);

    expect(res.body.message).toBe('Invalid credentials');
  });

  it('POST /auth/login locks account after 5 failed attempts', async () => {
    // Create a separate user for lockout testing
    const lockoutEmail = 'lockout@test.com';
    const lockoutHash = await argon2.hash('LockoutPass1!', ARGON2_OPTIONS);
    await prisma.user.create({
      data: {
        email: lockoutEmail,
        name: 'Lockout User',
        role: UserRole.EMPLOYEE,
        passwordHash: lockoutHash,
        isActive: true,
      },
    });

    // 5 failed attempts
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: lockoutEmail, password: 'WrongPass123', deviceId })
        .expect(401);
    }

    // 6th attempt should show lockout message
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: lockoutEmail, password: 'LockoutPass1!', deviceId })
      .expect(401);

    expect(res.body.message).toBe(
      'Account locked. Try again in 15 minutes.',
    );
  });

  // --- AUTH-02: Password management ---

  it('POST /auth/setup-password with valid token sets password', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await argon2.hash(rawToken, ARGON2_OPTIONS);
    const expiry = new Date(Date.now() + 72 * 60 * 60 * 1000);

    await prisma.user.create({
      data: {
        email: 'setup@test.com',
        name: 'Setup User',
        role: UserRole.EMPLOYEE,
        setupToken: hashedToken,
        setupTokenExpiry: expiry,
        isActive: true,
      },
    });

    const res = await request(app.getHttpServer())
      .post('/auth/setup-password')
      .send({ token: rawToken, password: 'NewPassword1!' })
      .expect(201);

    expect(res.body.message).toBe('Password set successfully');

    // Verify can now login with new password
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'setup@test.com', password: 'NewPassword1!', deviceId })
      .expect(201);

    expect(loginRes.body).toHaveProperty('accessToken');
  });

  it('POST /auth/setup-password with expired/invalid token returns 401', async () => {
    await request(app.getHttpServer())
      .post('/auth/setup-password')
      .send({ token: 'invalid-token-value', password: 'NewPassword1!' })
      .expect(401);
  });

  it('POST /auth/reset-password-request always returns 200 regardless of email existence', async () => {
    // Existing email
    await request(app.getHttpServer())
      .post('/auth/reset-password-request')
      .send({ email: adminEmail })
      .expect(201);

    // Non-existing email -- should still return success (no leak)
    await request(app.getHttpServer())
      .post('/auth/reset-password-request')
      .send({ email: 'nonexistent@test.com' })
      .expect(201);
  });

  it('POST /auth/reset-password with valid token resets password', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await argon2.hash(rawToken, ARGON2_OPTIONS);
    const expiry = new Date(Date.now() + 1 * 60 * 60 * 1000);

    await prisma.user.create({
      data: {
        email: 'reset@test.com',
        name: 'Reset User',
        role: UserRole.EMPLOYEE,
        passwordHash: await argon2.hash('OldPassword1!', ARGON2_OPTIONS),
        setupToken: hashedToken,
        setupTokenExpiry: expiry,
        isActive: true,
      },
    });

    const res = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: rawToken, password: 'ResetNewPass1!' })
      .expect(201);

    expect(res.body.message).toBe('Password set successfully');

    // Verify can login with new password
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'reset@test.com',
        password: 'ResetNewPass1!',
        deviceId,
      })
      .expect(201);

    expect(loginRes.body).toHaveProperty('accessToken');
  });

  // --- AUTH-03: Token refresh ---

  it('POST /auth/refresh with valid refresh token returns new token pair', async () => {
    const tokens = await loginAdmin();

    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send({ refreshToken: tokens.refreshToken, deviceId })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    // Refresh token must always be new (crypto random)
    expect(res.body.refreshToken).not.toBe(tokens.refreshToken);
    // Access token may be identical if issued within the same second (JWT iat has 1s precision)
  });

  it('POST /auth/refresh with reused token invalidates all sessions (rotation)', async () => {
    const tokens = await loginAdmin();

    // Use the refresh token once (valid)
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send({ refreshToken: tokens.refreshToken, deviceId })
      .expect(201);

    // Reuse the same refresh token (should fail -- token reuse detected)
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send({ refreshToken: tokens.refreshToken, deviceId })
      .expect(401);

    expect(res.body.message).toMatch(/Session expired|Token reuse detected/);
  });

  it('POST /auth/refresh with expired token returns 401', async () => {
    const tokens = await loginAdmin();

    // Use a bogus refresh token
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send({ refreshToken: 'totally-invalid-refresh-token', deviceId })
      .expect(401);

    expect(res.body.statusCode).toBe(401);
  });

  // --- AUTH-04: Role enforcement ---

  it('POST /users without ADMIN role returns 403', async () => {
    // Create an employee user
    const empHash = await argon2.hash('Employee1234!', ARGON2_OPTIONS);
    await prisma.user.create({
      data: {
        email: 'employee@test.com',
        name: 'Test Employee',
        role: UserRole.EMPLOYEE,
        passwordHash: empHash,
        isActive: true,
      },
    });

    // Login as employee
    const empTokens = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'employee@test.com',
        password: 'Employee1234!',
        deviceId,
      })
      .then((r) => r.body);

    // Try to create a user -- should be forbidden
    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${empTokens.accessToken}`)
      .send({ email: 'new@test.com', name: 'New User', role: 'EMPLOYEE' })
      .expect(403);
  });

  it('POST /users with ADMIN role creates user and returns 201', async () => {
    const tokens = await loginAdmin();

    const res = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send({
        email: 'created-by-admin@test.com',
        name: 'Created User',
        role: 'EMPLOYEE',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe('created-by-admin@test.com');
    expect(res.body.role).toBe('EMPLOYEE');
  });

  it('GET /health without auth returns 200 (public endpoint)', async () => {
    const res = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('GET /users/me without auth returns 401', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);
  });
});
