import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: {
    auditLog: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      auditLog: {
        create: jest.fn().mockResolvedValue(undefined),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('log()', () => {
    it('calls prisma.auditLog.create with correct data', async () => {
      const entry = {
        actorId: 'user-1',
        action: 'user.create',
        entityType: 'User',
        entityId: 'user-2',
        changes: { name: { old: null, new: 'John' } },
        ipAddress: '127.0.0.1',
      };

      await service.log(entry);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 'user-1',
          action: 'user.create',
          entityType: 'User',
          entityId: 'user-2',
          changesJson: entry.changes,
          ipAddress: '127.0.0.1',
        },
      });
    });

    it('stores changes as JSON (changesJson field)', async () => {
      const changes = {
        email: { old: 'a@b.com', new: 'c@d.com' },
        name: { old: 'Old', new: 'New' },
      };

      await service.log({
        actorId: null,
        action: 'user.update',
        entityType: 'User',
        entityId: 'user-1',
        changes,
      });

      const callData = prisma.auditLog.create.mock.calls[0][0].data;
      expect(callData.changesJson).toEqual(changes);
    });

    it('sets ipAddress to null when not provided', async () => {
      await service.log({
        actorId: 'user-1',
        action: 'user.delete',
        entityType: 'User',
        entityId: 'user-2',
        changes: {},
      });

      const callData = prisma.auditLog.create.mock.calls[0][0].data;
      expect(callData.ipAddress).toBeNull();
    });
  });

  describe('findAll()', () => {
    it('returns paginated results with default limit and offset', async () => {
      const mockData = [
        { id: '1', action: 'user.create', entityType: 'User', entityId: 'u1' },
      ];
      prisma.auditLog.findMany.mockResolvedValue(mockData);
      prisma.auditLog.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: mockData,
        total: 1,
        limit: 50,
        offset: 0,
      });
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50, skip: 0 }),
      );
    });

    it('filters by entityType', async () => {
      await service.findAll({ entityType: 'User' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ entityType: 'User' }),
        }),
      );
    });

    it('filters by actorId', async () => {
      await service.findAll({ actorId: 'actor-1' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ actorId: 'actor-1' }),
        }),
      );
    });

    it('filters by entityId', async () => {
      await service.findAll({ entityId: 'entity-1' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ entityId: 'entity-1' }),
        }),
      );
    });

    it('respects custom limit and offset', async () => {
      await service.findAll({ limit: 10, offset: 20 });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10, skip: 20 }),
      );
    });
  });

  describe('append-only contract', () => {
    it('has no update or delete methods', () => {
      const proto = Object.getOwnPropertyNames(
        Object.getPrototypeOf(service),
      );
      expect(proto).not.toContain('update');
      expect(proto).not.toContain('delete');
      expect(proto).not.toContain('remove');
      expect(proto).not.toContain('destroy');
    });
  });
});
