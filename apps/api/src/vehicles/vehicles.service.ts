import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleStatus, FuelType, TransmissionType, InsuranceCoverageType } from '@rentapp/shared';
import { Prisma, VehicleDocument } from '@prisma/client';

const VEHICLE_INCLUDE = {
  insurance: true,
  inspection: true,
  documents: true,
  vehicleClass: true,
};

@Injectable()
export class VehiclesService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async create(dto: CreateVehicleDto) {
    const { insurance, inspection, vehicleClassId, ...vehicleData } = dto;

    return this.prisma.vehicle.create({
      data: {
        ...vehicleData,
        ...(vehicleClassId ? { vehicleClass: { connect: { id: vehicleClassId } } } : {}),
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

  async findAll(filter: 'active' | 'archived' | 'all' = 'active') {
    const where =
      filter === 'all' ? {} : filter === 'archived' ? { isArchived: true } : { isArchived: false };
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
      if (dto.status === VehicleStatus.RENTED || dto.status === VehicleStatus.RESERVED) {
        throw new BadRequestException('Status RENTED/RESERVED is managed by rental lifecycle');
      }
      if (existing.status === VehicleStatus.RETIRED && dto.status !== VehicleStatus.RETIRED) {
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

  async unarchive(id: string) {
    await this.findOne(id); // Ensure exists
    return this.prisma.vehicle.update({
      where: { id },
      data: { isArchived: false, status: VehicleStatus.AVAILABLE },
      include: VEHICLE_INCLUDE,
    });
  }

  async hardDelete(id: string) {
    const vehicle = await this.findOne(id);

    // Check no active rentals reference this vehicle
    const activeRentals = await this.prisma.rental.count({
      where: {
        vehicleId: id,
        status: { in: ['ACTIVE', 'EXTENDED', 'DRAFT'] },
      },
    });
    if (activeRentals > 0) {
      throw new BadRequestException('Cannot delete vehicle with active rentals');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.vehicleDocument.deleteMany({ where: { vehicleId: id } });
      await tx.vehicleInsurance.deleteMany({ where: { vehicleId: id } });
      await tx.vehicleInspection.deleteMany({ where: { vehicleId: id } });
      await tx.vehicle.delete({ where: { id } });
    });

    return vehicle;
  }

  async uploadDocument(vehicleId: string, file: Express.Multer.File, label: string) {
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

  async importFleet(file: Express.Multer.File) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);

    const columnMapping: Record<string, string[]> = {
      registration: ['registration', 'rejestracja'],
      vin: ['vin', 'VIN'],
      make: ['make', 'marka'],
      model: ['model'],
      year: ['year', 'rok'],
      color: ['color', 'kolor'],
      fuelType: ['fuelType', 'paliwo'],
      transmission: ['transmission', 'skrzynia'],
      seatCount: ['seatCount', 'miejsca'],
      mileage: ['mileage', 'przebieg'],
      insuranceCompany: ['insuranceCompany', 'ubezpieczyciel'],
      insurancePolicyNumber: ['insurancePolicyNumber', 'polisa'],
      insuranceExpiry: ['insuranceExpiry', 'ubezpieczenieData'],
      insuranceCoverage: ['insuranceCoverage', 'ubezpieczenieTyp'],
      inspectionExpiry: ['inspectionExpiry', 'przegladData'],
      notes: ['notes', 'uwagi'],
    };

    const requiredFields = [
      'registration',
      'vin',
      'make',
      'model',
      'year',
      'fuelType',
      'transmission',
    ];

    // Normalize all rows first, then bulk pre-fetch existing registrations
    const normalizedRows: Array<{ rowNum: number; normalized: Record<string, unknown> }> = [];

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const rowNum = i + 2; // +2 for 1-indexed and header row

      const normalized: Record<string, unknown> = {};
      for (const [targetKey, aliases] of Object.entries(columnMapping)) {
        for (const alias of aliases) {
          if (raw[alias] !== undefined) {
            normalized[targetKey] = raw[alias];
            break;
          }
        }
      }
      normalizedRows.push({ rowNum, normalized });
    }

    // Extract all registrations from parsed rows for bulk lookup
    const allRegistrations = normalizedRows
      .map((r) => r.normalized.registration)
      .filter((reg): reg is string | number => reg !== undefined && reg !== null && reg !== '')
      .map((reg) => String(reg));

    // Single bulk query instead of N individual findUnique calls
    const existingVehicles = await this.prisma.vehicle.findMany({
      where: { registration: { in: allRegistrations } },
      select: { registration: true },
    });
    const existingRegistrations = new Set(existingVehicles.map((v) => v.registration));

    let imported = 0;
    let skipped = 0;
    const errors: Array<{ row: number; reason: string }> = [];

    for (const { rowNum, normalized } of normalizedRows) {
      // Validate required fields
      const missingFields = requiredFields.filter(
        (f) => normalized[f] === undefined || normalized[f] === null || normalized[f] === '',
      );
      if (missingFields.length > 0) {
        skipped++;
        errors.push({
          row: rowNum,
          reason: `Missing required fields: ${missingFields.join(', ')}`,
        });
        continue;
      }

      const registration = String(normalized.registration);

      // Check for duplicate registration using pre-fetched Set (O(1) lookup)
      if (existingRegistrations.has(registration)) {
        skipped++;
        errors.push({
          row: rowNum,
          reason: `Duplicate registration: ${registration}`,
        });
        continue;
      }

      try {
        const insuranceData =
          normalized.insuranceCompany && normalized.insurancePolicyNumber
            ? {
                create: {
                  companyName: String(normalized.insuranceCompany),
                  policyNumber: String(normalized.insurancePolicyNumber),
                  expiryDate: normalized.insuranceExpiry
                    ? new Date(String(normalized.insuranceExpiry))
                    : new Date('2099-12-31'),
                  coverageType: String(
                    normalized.insuranceCoverage || 'OC',
                  ) as InsuranceCoverageType,
                },
              }
            : undefined;

        const inspectionData = normalized.inspectionExpiry
          ? {
              create: {
                expiryDate: new Date(String(normalized.inspectionExpiry)),
              },
            }
          : undefined;

        await this.prisma.vehicle.create({
          data: {
            registration,
            vin: String(normalized.vin),
            make: String(normalized.make),
            model: String(normalized.model),
            year: Number(normalized.year),
            color: normalized.color ? String(normalized.color) : undefined,
            fuelType: String(normalized.fuelType) as FuelType,
            transmission: String(normalized.transmission) as TransmissionType,
            seatCount: normalized.seatCount ? Number(normalized.seatCount) : undefined,
            mileage: normalized.mileage ? Number(normalized.mileage) : undefined,
            notes: normalized.notes ? String(normalized.notes) : undefined,
            vehicleClass: {
              connectOrCreate: {
                where: { name: 'Nieokreslona' },
                create: { name: 'Nieokreslona' },
              },
            },
            insurance: insuranceData,
            inspection: inspectionData,
          },
        });
        imported++;
        // Track newly created registration to prevent intra-batch duplicates
        existingRegistrations.add(registration);
      } catch (err: unknown) {
        skipped++;
        errors.push({
          row: rowNum,
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return { imported, skipped, errors };
  }

  async toDto(vehicle: Prisma.VehicleGetPayload<{ include: typeof VEHICLE_INCLUDE }>) {
    const photoUrl = vehicle.photoKey
      ? await this.storage.getPresignedDownloadUrl(vehicle.photoKey)
      : null;

    const documents = await Promise.all(
      (vehicle.documents || []).map(async (doc: VehicleDocument) => ({
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
              ? await this.storage.getPresignedDownloadUrl(vehicle.insurance.documentKey)
              : null,
          }
        : null,
      inspection: vehicle.inspection
        ? {
            id: vehicle.inspection.id,
            expiryDate: vehicle.inspection.expiryDate.toISOString(),
            documentUrl: vehicle.inspection.documentKey
              ? await this.storage.getPresignedDownloadUrl(vehicle.inspection.documentKey)
              : null,
          }
        : null,
      documents,
      createdAt: vehicle.createdAt.toISOString(),
      updatedAt: vehicle.updatedAt.toISOString(),
    };
  }
}
