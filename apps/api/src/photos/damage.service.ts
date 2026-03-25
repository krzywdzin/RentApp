import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DAMAGE_TYPES,
  SEVERITY_LEVELS,
  type DamagePin,
  type DamageComparisonResult,
  type DamageType,
  type SeverityLevel,
  type SvgView,
} from '@rentapp/shared';
import { Prisma } from '@prisma/client';
import { CreateDamageReportDto } from './dto/create-damage-report.dto';
import { CreateDamagePinDto } from './dto/create-damage-pin.dto';

function parseDamagePins(json: Prisma.JsonValue): DamagePin[] {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as DamagePin[];
}

@Injectable()
export class DamageService {
  private readonly logger = new Logger(DamageService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdateReport(dto: CreateDamageReportDto) {
    const pins = dto.pins ?? [];

    // Validate pin coordinates
    for (const pin of pins) {
      this.validatePin(pin);
    }

    return this.prisma.damageReport.upsert({
      where: { walkthroughId: dto.walkthroughId },
      create: {
        walkthroughId: dto.walkthroughId,
        pins: pins as unknown as Prisma.InputJsonValue,
        noDamageConfirmed: dto.noDamageConfirmed ?? false,
      },
      update: {
        pins: pins as unknown as Prisma.InputJsonValue,
        noDamageConfirmed: dto.noDamageConfirmed ?? false,
      },
    });
  }

  async getReport(walkthroughId: string) {
    const report = await this.prisma.damageReport.findUnique({
      where: { walkthroughId },
    });

    if (!report) {
      throw new NotFoundException('Damage report not found');
    }

    return report;
  }

  async getDamageComparison(rentalId: string): Promise<DamageComparisonResult> {
    const handoverWt = await this.prisma.photoWalkthrough.findFirst({
      where: { rentalId, type: 'HANDOVER' },
      include: { damageReport: true },
    });

    const returnWt = await this.prisma.photoWalkthrough.findFirst({
      where: { rentalId, type: 'RETURN' },
      include: { damageReport: true },
    });

    const handoverPins = parseDamagePins(handoverWt?.damageReport?.pins ?? null);
    const returnPins = parseDamagePins(returnWt?.damageReport?.pins ?? null);

    const newPins = returnPins.filter((pin) => !pin.isPreExisting);

    return {
      handoverPins,
      returnPins,
      newPins,
    };
  }

  async addPin(walkthroughId: string, pinDto: CreateDamagePinDto) {
    this.validatePin(pinDto);

    const report = await this.prisma.damageReport.findUnique({
      where: { walkthroughId },
    });

    if (!report) {
      throw new NotFoundException('Damage report not found');
    }

    const existingPins = parseDamagePins(report.pins);
    const nextPinNumber =
      existingPins.length > 0
        ? Math.max(...existingPins.map((p) => p.pinNumber)) + 1
        : 1;

    const newPin: DamagePin = {
      pinNumber: nextPinNumber,
      svgView: pinDto.svgView as SvgView,
      x: pinDto.x,
      y: pinDto.y,
      damageType: pinDto.damageType as DamageType,
      severity: pinDto.severity as SeverityLevel,
      note: pinDto.note,
      photoKey: pinDto.photoKey,
      isPreExisting: pinDto.isPreExisting,
    };

    const updatedPins = [...existingPins, newPin];

    return this.prisma.damageReport.update({
      where: { walkthroughId },
      data: { pins: updatedPins as unknown as Prisma.InputJsonValue },
    });
  }

  async removePin(walkthroughId: string, pinNumber: number) {
    const report = await this.prisma.damageReport.findUnique({
      where: { walkthroughId },
    });

    if (!report) {
      throw new NotFoundException('Damage report not found');
    }

    const pins = parseDamagePins(report.pins);
    const pinExists = pins.some((p) => p.pinNumber === pinNumber);

    if (!pinExists) {
      throw new NotFoundException(`Pin ${pinNumber} not found`);
    }

    const remaining = pins.filter((p) => p.pinNumber !== pinNumber);

    // Renumber sequentially
    remaining.forEach((p, i) => {
      p.pinNumber = i + 1;
    });

    return this.prisma.damageReport.update({
      where: { walkthroughId },
      data: { pins: remaining as unknown as Prisma.InputJsonValue },
    });
  }

  async confirmNoDamage(walkthroughId: string) {
    const report = await this.prisma.damageReport.findUnique({
      where: { walkthroughId },
    });

    if (!report) {
      throw new NotFoundException('Damage report not found');
    }

    const pins = parseDamagePins(report.pins);

    if (pins.length > 0) {
      throw new BadRequestException(
        'Cannot confirm no damage when pins exist. Remove all pins first.',
      );
    }

    return this.prisma.damageReport.update({
      where: { walkthroughId },
      data: { noDamageConfirmed: true },
    });
  }

  private validatePin(pin: CreateDamagePinDto): void {
    if (pin.x < 0 || pin.x > 100 || pin.y < 0 || pin.y > 100) {
      throw new BadRequestException(
        'Pin coordinates must be between 0 and 100',
      );
    }

    const validDamageTypes: readonly string[] = DAMAGE_TYPES;
    if (!validDamageTypes.includes(pin.damageType)) {
      throw new BadRequestException(
        `Invalid damage type: ${pin.damageType}. Allowed: ${DAMAGE_TYPES.join(', ')}`,
      );
    }

    const validSeverities: readonly string[] = SEVERITY_LEVELS;
    if (!validSeverities.includes(pin.severity)) {
      throw new BadRequestException(
        `Invalid severity: ${pin.severity}. Allowed: ${SEVERITY_LEVELS.join(', ')}`,
      );
    }
  }
}
