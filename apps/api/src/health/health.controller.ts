import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Controller()
export class HealthController {
  private redis: Redis | null = null;

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private config: ConfigService,
  ) {
    try {
      const redisUrl = this.config.get<string>(
        'REDIS_URL',
        'redis://localhost:6379',
      );
      this.redis = new Redis(redisUrl);
      this.redis.on('error', () => {});
    } catch {
      this.redis = null;
    }
  }

  @Public()
  @Get('health')
  async health() {
    const [db, redis, storageResult] = await Promise.allSettled([
      this.prisma.$queryRaw`SELECT 1`,
      this.redis?.ping(),
      Promise.resolve((this.storage as any).s3Available),
    ]);

    const dbOk = db.status === 'fulfilled';
    const redisOk =
      redis.status === 'fulfilled' && redis.value === 'PONG';
    const storageOk =
      storageResult.status === 'fulfilled' ? !!storageResult.value : false;

    return {
      status: dbOk && redisOk ? 'ok' : 'degraded',
      db: dbOk,
      redis: redisOk,
      storage: storageOk,
      timestamp: new Date().toISOString(),
    };
  }
}
