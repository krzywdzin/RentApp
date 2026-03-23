import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleStatus } from '@rentapp/shared';

const VEHICLE_INCLUDE = {
  insurance: true,
  inspection: true,
  documents: true,
};

@Injectable()
export class VehiclesService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async create(dto: CreateVehicleDto) {
    const { insurance, inspection, ...vehicleData } = dto;

    return this.prisma.vehicle.create({
      data: {
        ...vehicleData,
        insurance: insurance
          ? {
              create: {
                ...insurance,
                expiryDate: new Date(insurance.expiryDate),
              },
            }
          : undefined,
        inspection: inspection
          ? {
              create: {
                expiryDate: new Date(inspection.expiryDate),
              },
            }
          : undefined,
      },
      include: VEHICLE_INCLUDE,
    });
  }

  async findAll(includeArchived = false) {
    const where = includeArchived ? {} : { isArchived: false };
    return this.prisma.vehicle.findMany({
      where,
      include: VEHICLE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: VEHICLE_INCLUDE,
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID "${id}" not found`);
    }
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto) {
    const existing = await this.findOne(id);

    // Status transition validation
    if (dto.status) {
      if (
        dto.status === VehicleStatus.RENTED ||
        dto.status === VehicleStatus.RESERVED
      ) {
        throw new BadRequestException(
          'Status RENTED/RESERVED is managed by rental lifecycle',
        );
      }
      if (
        existing.status === VehicleStatus.RETIRED &&
        dto.status !== VehicleStatus.RETIRED
      ) {
        throw new BadRequestException('Cannot reactivate a retired vehicle');
      }
    }

    // Build oldValues diff
    const { insurance, inspection, ...flatFields } = dto;
    const oldValues: Record<string, { old: unknown; new: unknown }> = {};

    for (const [key, newVal] of Object.entries(flatFields)) {
      if (newVal !== undefined) {
        const existingVal = (existing as Record<string, unknown>)[key];
        if (existingVal !== newVal) {
          oldValues[key] = { old: existingVal, new: newVal };
        }
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = { ...flatFields };

    if (insurance) {
      updateData.insurance = {
        upsert: {
          create: {
            ...insurance,
            expiryDate: new Date(insurance.expiryDate),
          },
          update: {
            ...insurance,
            expiryDate: new Date(insurance.expiryDate),
          },
        },
      };
    }

    if (inspection) {
      updateData.inspection = {
        upsert: {
          create: {
            expiryDate: new Date(inspection.expiryDate),
          },
          update: {
            expiryDate: new Date(inspection.expiryDate),
          },
        },
      };
    }

    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: updateData,
      include: VEHICLE_INCLUDE,
    });

    return { oldValues, vehicle };
  }

  async archive(id: string) {
    await this.findOne(id); // Ensure exists
    return this.prisma.vehicle.update({
      where: { id },
      data: { isArchived: true, status: VehicleStatus.RETIRED },
      include: VEHICLE_INCLUDE,
    });
  }

  async uploadDocument(
    vehicleId: string,
    file: Express.Multer.File,
    label: string,
  ) {
    await this.findOne(vehicleId); // Ensure exists
    const ext = file.originalname.split('.').pop() || 'bin';
    const key = `vehicles/${vehicleId}/documents/${label}-${uuidv4()}.${ext}`;
    await this.storage.upload(key, file.buffer, file.mimetype);

    return this.prisma.vehicleDocument.create({
      data: {
        vehicleId,
        label,
        fileKey: key,
        fileName: file.originalname,
        mimeType: file.mimetype,
      },
    });
  }

  async uploadPhoto(vehicleId: string, file: Express.Multer.File) {
    await this.findOne(vehicleId); // Ensure exists
    const ext = file.originalname.split('.').pop() || 'jpg';
    const key = `vehicles/${vehicleId}/photo.${ext}`;
    await this.storage.upload(key, file.buffer, file.mimetype);

    await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { photoKey: key },
    });

    const url = await this.storage.getPresignedDownloadUrl(key);
    return { photoKey: key, photoUrl: url };
  }

  async toDto(vehicle: any) {
    const photoUrl = vehicle.photoKey
      ? await this.storage.getPresignedDownloadUrl(vehicle.photoKey)
      : null;

    const documents = await Promise.all(
      (vehicle.documents || []).map(async (doc: any) => ({
        id: doc.id,
        label: doc.label,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        downloadUrl: await this.storage.getPresignedDownloadUrl(doc.fileKey),
        uploadedAt: doc.uploadedAt,
      })),
    );

    return {
      id: vehicle.id,
      registration: vehicle.registration,
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      fuelType: vehicle.fuelType,
      transmission: vehicle.transmission,
      seatCount: vehicle.seatCount,
      mileage: vehicle.mileage,
      notes: vehicle.notes,
      status: vehicle.status,
      photoUrl,
      isArchived: vehicle.isArchived,
      insurance: vehicle.insurance
        ? {
            id: vehicle.insurance.id,
            companyName: vehicle.insurance.companyName,
            policyNumber: vehicle.insurance.policyNumber,
            expiryDate: vehicle.insurance.expiryDate.toISOString(),
            coverageType: vehicle.insurance.coverageType,
            documentUrl: vehicle.insurance.documentKey
              ? await this.storage.getPresignedDownloadUrl(
                  vehicle.insurance.documentKey,
                )
              : null,
          }
        : null,
      inspection: vehicle.inspection
        ? {
            id: vehicle.inspection.id,
            expiryDate: vehicle.inspection.expiryDate.toISOString(),
            documentUrl: vehicle.inspection.documentKey
              ? await this.storage.getPresignedDownloadUrl(
                  vehicle.inspection.documentKey,
                )
              : null,
          }
        : null,
      documents,
      createdAt: vehicle.createdAt.toISOString(),
      updatedAt: vehicle.updatedAt.toISOString(),
    };
  }
}
