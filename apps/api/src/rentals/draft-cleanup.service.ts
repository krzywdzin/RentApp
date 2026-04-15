import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RentalStatus } from '@rentapp/shared';

@Injectable()
export class DraftCleanupService {
  private readonly logger = new Logger(DraftCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('*/15 * * * *')
  async cleanupStaleDrafts() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const { count } = await this.prisma.rental.deleteMany({
      where: {
        status: RentalStatus.DRAFT,
        createdAt: { lt: oneHourAgo },
      },
    });

    if (count > 0) {
      this.logger.log(`Cleaned up ${count} stale DRAFT rental(s)`);
    }
  }
}
