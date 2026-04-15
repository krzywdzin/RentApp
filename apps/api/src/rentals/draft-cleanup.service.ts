import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DraftCleanupService {
  private readonly logger = new Logger(DraftCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('*/15 * * * *')
  async cleanupStaleDrafts() {
    const result = await this.prisma.$executeRaw`
      WITH stale_drafts AS (
        SELECT id FROM rentals
        WHERE status = 'DRAFT' AND "createdAt" < NOW() - INTERVAL '1 hour'
      ),
      del_sigs AS (
        DELETE FROM contract_signatures
        WHERE "contractId" IN (SELECT id FROM contracts WHERE "rentalId" IN (SELECT id FROM stale_drafts))
      ),
      del_contracts AS (
        DELETE FROM contracts WHERE "rentalId" IN (SELECT id FROM stale_drafts)
      )
      DELETE FROM rentals WHERE id IN (SELECT id FROM stale_drafts)
    `;

    if (result > 0) {
      this.logger.log(`Cleaned up ${result} stale DRAFT rental(s)`);
    }
  }
}
