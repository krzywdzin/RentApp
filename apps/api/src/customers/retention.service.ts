import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredCustomers() {
    const now = new Date();

    // Find expired, archived customers with no active rentals
    const expired = await this.prisma.customer.findMany({
      where: {
        retentionExpiresAt: { lte: now },
        isArchived: true,
        rentals: {
          none: { status: { in: ['ACTIVE', 'PENDING', 'RESERVED'] } },
        },
      },
      select: { id: true },
    });

    // Count customers skipped due to active rentals
    const skippedCount = await this.prisma.customer.count({
      where: {
        retentionExpiresAt: { lte: now },
        isArchived: true,
        rentals: {
          some: { status: { in: ['ACTIVE', 'PENDING', 'RESERVED'] } },
        },
      },
    });

    if (skippedCount > 0) {
      this.logger.warn(
        `Skipped ${skippedCount} customers with active rentals during retention cleanup`,
      );
    }

    if (expired.length === 0) {
      this.logger.log('Retention cleanup: no expired customers found');
      return { deleted: 0 };
    }

    const ids = expired.map((c) => c.id);

    // Hard-delete expired customer records (RODO right to erasure)
    const result = await this.prisma.customer.deleteMany({
      where: { id: { in: ids } },
    });

    this.logger.log(
      `Retention cleanup: deleted ${result.count} expired customer records`,
    );
    return { deleted: result.count };
  }

  // Manual trigger for testing or admin use
  async runCleanup() {
    return this.cleanupExpiredCustomers();
  }
}
