import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleClassDto } from './dto/create-vehicle-class.dto';
import { UpdateVehicleClassDto } from './dto/update-vehicle-class.dto';

@Injectable()
export class VehicleClassesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.vehicleClass.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateVehicleClassDto) {
    try {
      return await this.prisma.vehicleClass.create({
        data: { name: dto.name },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Klasa o tej nazwie juz istnieje');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateVehicleClassDto) {
    try {
      return await this.prisma.vehicleClass.update({
        where: { id },
        data: { name: dto.name },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Klasa o tej nazwie juz istnieje');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Klasa nie zostala znaleziona');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const count = await this.prisma.vehicle.count({
      where: { vehicleClassId: id },
    });
    if (count > 0) {
      throw new ConflictException(
        'Nie mozna usunac klasy przypisanej do pojazdow',
      );
    }
    return this.prisma.vehicleClass.delete({ where: { id } });
  }
}
