import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDamageReportDto } from './dto/create-damage-report.dto';
import { CreateDamagePinDto } from './dto/create-damage-pin.dto';

@Injectable()
export class DamageService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdateReport(dto: CreateDamageReportDto) {
    throw new NotImplementedException('createOrUpdateReport not yet implemented');
  }

  async getReport(walkthroughId: string) {
    throw new NotImplementedException('getReport not yet implemented');
  }

  async getDamageComparison(rentalId: string) {
    throw new NotImplementedException('getDamageComparison not yet implemented');
  }

  async addPin(walkthroughId: string, pin: CreateDamagePinDto) {
    throw new NotImplementedException('addPin not yet implemented');
  }

  async removePin(walkthroughId: string, pinNumber: number) {
    throw new NotImplementedException('removePin not yet implemented');
  }

  async confirmNoDamage(walkthroughId: string) {
    throw new NotImplementedException('confirmNoDamage not yet implemented');
  }
}
