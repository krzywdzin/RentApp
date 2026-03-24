import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAlertConfigDto } from '../notifications/dto/update-alert-config.dto';
import { DEFAULT_ALERT_CONFIGS } from '../notifications/constants/notification-types';
import { AlertConfig } from '@prisma/client';

@Injectable()
export class AlertConfigService implements OnModuleInit {
  private readonly logger = new Logger(AlertConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  async seedDefaults(): Promise<void> {
    for (const config of DEFAULT_ALERT_CONFIGS) {
      await this.prisma.alertConfig.upsert({
        where: { alertType: config.alertType },
        create: {
          alertType: config.alertType,
          enabled: config.enabled,
          leadTimeDays: config.leadTimeDays,
          channels: JSON.stringify(config.channels),
          maxRepeat: config.maxRepeat,
        },
        update: {},
      });
    }
    this.logger.log(
      `Seeded ${DEFAULT_ALERT_CONFIGS.length} default alert configs`,
    );
  }

  async findAll(): Promise<AlertConfig[]> {
    return this.prisma.alertConfig.findMany({
      orderBy: { alertType: 'asc' },
    });
  }

  async findByType(alertType: string): Promise<AlertConfig | null> {
    return this.prisma.alertConfig.findUnique({
      where: { alertType },
    });
  }

  async update(
    alertType: string,
    dto: UpdateAlertConfigDto,
  ): Promise<AlertConfig> {
    const existing = await this.prisma.alertConfig.findUnique({
      where: { alertType },
    });
    if (!existing) {
      throw new NotFoundException(
        `Alert config for type "${alertType}" not found`,
      );
    }

    return this.prisma.alertConfig.update({
      where: { alertType },
      data: {
        ...(dto.enabled !== undefined && { enabled: dto.enabled }),
        ...(dto.leadTimeDays !== undefined && {
          leadTimeDays: dto.leadTimeDays,
        }),
        ...(dto.channels !== undefined && {
          channels: JSON.stringify(dto.channels),
        }),
        ...(dto.maxRepeat !== undefined && { maxRepeat: dto.maxRepeat }),
      },
    });
  }
}
