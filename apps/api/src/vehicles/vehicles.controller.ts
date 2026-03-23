import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
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
  async findAll(@Query('includeArchived') includeArchived?: string) {
    return this.vehiclesService.findAll(includeArchived === 'true');
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
