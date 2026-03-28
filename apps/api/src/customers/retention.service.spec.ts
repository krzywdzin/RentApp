import { Test, TestingModule } from '@nestjs/testing';
import { RetentionService } from './retention.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RetentionService', () => {
  let service: RetentionService;
  let prisma: {
    customer: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      customer: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetentionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RetentionService>(RetentionService);
  });

  it('deletes customers where retentionExpiresAt <= now AND isArchived is true', async () => {
    const expiredCustomers = [{ id: 'cust-1' }, { id: 'cust-2' }];
    prisma.customer.findMany.mockResolvedValue(expiredCustomers);
    prisma.customer.deleteMany.mockResolvedValue({ count: 2 });

    const result = await service.cleanupExpiredCustomers();

    expect(prisma.customer.findMany).toHaveBeenCalledWith({
      where: {
        retentionExpiresAt: { lte: expect.any(Date) },
        isArchived: true,
        rentals: {
          none: { status: { in: ['ACTIVE', 'EXTENDED', 'DRAFT'] } },
        },
      },
      select: { id: true },
    });
    expect(prisma.customer.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['cust-1', 'cust-2'] } },
    });
    expect(result).toEqual({ deleted: 2 });
  });

  it('returns { deleted: 0 } when no expired customers exist', async () => {
    prisma.customer.findMany.mockResolvedValue([]);

    const result = await service.cleanupExpiredCustomers();

    expect(result).toEqual({ deleted: 0 });
    expect(prisma.customer.deleteMany).not.toHaveBeenCalled();
  });

  it('returns { deleted: N } matching the count of deleted records', async () => {
    prisma.customer.findMany.mockResolvedValue([
      { id: 'cust-1' },
      { id: 'cust-2' },
      { id: 'cust-3' },
    ]);
    prisma.customer.deleteMany.mockResolvedValue({ count: 3 });

    const result = await service.cleanupExpiredCustomers();

    expect(result).toEqual({ deleted: 3 });
  });

  it('only queries for archived customers (non-archived are excluded even if expired)', async () => {
    prisma.customer.findMany.mockResolvedValue([]);

    await service.cleanupExpiredCustomers();

    const whereClause = prisma.customer.findMany.mock.calls[0][0].where;
    expect(whereClause.isArchived).toBe(true);
  });
});
