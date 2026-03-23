import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuditModule } from '../src/audit/audit.module';
import { AuditService } from '../src/audit/audit.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaModule } from '../src/prisma/prisma.module';

/**
 * Audit e2e tests use a mocked PrismaService to avoid DB dependency.
 * These validate the HTTP layer: routing, guards, query validation,
 * and response shape. Full integration tests require a running database.
 */
describe('Audit (e2e)', () => {
  let app: INestApplication;
  let auditService: AuditService;
  const mockAuditLogs = [
    {
      id: 'audit-1',
      actorId: 'admin-1',
      action: 'user.post',
      entityType: 'User',
      entityId: 'user-1',
      changesJson: { body: { old: null, new: { name: 'Test' } } },
      ipAddress: '::1',
      createdAt: new Date('2026-01-01'),
      actor: { id: 'admin-1', name: 'Admin', email: 'admin@test.com' },
    },
  ];

  const mockPrisma = {
    auditLog: {
      create: jest.fn().mockResolvedValue(undefined),
      findMany: jest.fn().mockResolvedValue(mockAuditLogs),
      count: jest.fn().mockResolvedValue(1),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AuditModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    auditService = moduleFixture.get<AuditService>(AuditService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.auditLog.findMany.mockResolvedValue(mockAuditLogs);
    mockPrisma.auditLog.count.mockResolvedValue(1);
  });

  describe('GET /audit', () => {
    it('returns paginated audit logs', async () => {
      const res = await request(app.getHttpServer())
        .get('/audit')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('limit');
      expect(res.body).toHaveProperty('offset');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].action).toBe('user.post');
    });

    it('filters by entityType query param', async () => {
      await request(app.getHttpServer())
        .get('/audit?entityType=User')
        .expect(200);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ entityType: 'User' }),
        }),
      );
    });

    it('filters by actorId query param', async () => {
      await request(app.getHttpServer())
        .get('/audit?actorId=admin-1')
        .expect(200);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ actorId: 'admin-1' }),
        }),
      );
    });

    it('filters by entityId query param', async () => {
      await request(app.getHttpServer())
        .get('/audit?entityId=user-1')
        .expect(200);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ entityId: 'user-1' }),
        }),
      );
    });

    it('respects limit and offset query params', async () => {
      await request(app.getHttpServer())
        .get('/audit?limit=10&offset=5')
        .expect(200);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10, skip: 5 }),
      );
    });
  });

  describe('AuditService contract', () => {
    it('log() calls prisma.auditLog.create', async () => {
      await auditService.log({
        actorId: 'user-1',
        action: 'test.create',
        entityType: 'Test',
        entityId: 'test-1',
        changes: {},
        ipAddress: '127.0.0.1',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(1);
    });

    it('audit log entry contains actorId, action, entityType, entityId, changes', async () => {
      const entry = {
        actorId: 'actor-1',
        action: 'user.post',
        entityType: 'User',
        entityId: 'user-2',
        changes: { name: { old: null, new: 'Jane' } },
        ipAddress: '::1',
      };

      await auditService.log(entry);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorId: 'actor-1',
          action: 'user.post',
          entityType: 'User',
          entityId: 'user-2',
          changesJson: entry.changes,
        }),
      });
    });
  });
});
