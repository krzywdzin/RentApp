import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UserRole } from '@rentapp/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

const DOCUMENT_LABELS = [
  'insurance_policy',
  'inspection_cert',
  'registration_card',
];

@Controller('vehicles')
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async findAll(@Query('filter') filter?: string) {
    const validFilters = ['active', 'archived', 'all'] as const;
    const f = validFilters.includes(filter as typeof validFilters[number])
      ? (filter as 'active' | 'archived' | 'all')
      : 'active';
    return this.vehiclesService.findAll(f);
  }

  @Post('import')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        cb(
          null,
          allowed.includes(file.mimetype) ||
            /\.(csv|xls|xlsx)$/i.test(file.originalname),
        );
      },
    }),
  )
  async importFleet(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required. Accepted formats: CSV, XLS, XLSX');
    }
    return this.vehiclesService.importFleet(file);
  }

  @Get('import/template')
  @Roles(UserRole.ADMIN)
  async getImportTemplate(@Res() res: Response) {
    const headers =
      'registration,vin,make,model,year,color,fuelType,transmission,seatCount,mileage,insuranceCompany,insurancePolicyNumber,insuranceExpiry,insuranceCoverage,inspectionExpiry,notes';
    const example =
      'WE12345,WVWZZZ3CZWE123456,Volkswagen,Golf,2022,Silver,PETROL,MANUAL,5,45000,PZU,ABC123456,2026-12-31,OC,2026-06-15,Fleet car';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=fleet-import-template.csv',
    );
    res.send(`${headers}\n${example}\n`);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    const { oldValues, vehicle } = await this.vehiclesService.update(id, dto);
    return {
      ...vehicle,
      __audit: {
        action: 'vehicle.update',
        entityType: 'Vehicle',
        entityId: id,
        changes: oldValues,
      },
    };
  }

  @Patch(':id/archive')
  @Roles(UserRole.ADMIN)
  async archive(@Param('id', ParseUUIDPipe) id: string) {
    const vehicle = await this.vehiclesService.archive(id);
    return {
      ...vehicle,
      __audit: {
        action: 'vehicle.archive',
        entityType: 'Vehicle',
        entityId: id,
        changes: { isArchived: { old: false, new: true } },
      },
    };
  }

  @Patch(':id/unarchive')
  @Roles(UserRole.ADMIN)
  async unarchive(@Param('id', ParseUUIDPipe) id: string) {
    const vehicle = await this.vehiclesService.unarchive(id);
    return {
      ...vehicle,
      __audit: {
        action: 'vehicle.unarchive',
        entityType: 'Vehicle',
        entityId: id,
        changes: { isArchived: { old: true, new: false } },
      },
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    const vehicle = await this.vehiclesService.hardDelete(id);
    return {
      ...vehicle,
      __audit: {
        action: 'vehicle.delete',
        entityType: 'Vehicle',
        entityId: id,
      },
    };
  }

  @Post(':id/documents')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('label') label: string,
  ) {
    if (!label || !DOCUMENT_LABELS.includes(label)) {
      throw new BadRequestException(
        `Label must be one of: ${DOCUMENT_LABELS.join(', ')}`,
      );
    }
    return this.vehiclesService.uploadDocument(id, file, label);
  }

  @Post(':id/photo')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only image files are allowed'), false);
        }
      },
    }),
  )
  async uploadPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.vehiclesService.uploadPhoto(id, file);
  }
}
