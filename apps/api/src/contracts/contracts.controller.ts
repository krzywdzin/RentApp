import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  Res,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { UserRole } from '@rentapp/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ContractsService } from './contracts.service';
import { StorageService } from '../storage/storage.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';

@Controller('contracts')
export class ContractsController {
  constructor(
    private contractsService: ContractsService,
    private storageService: StorageService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async create(
    @Body() dto: CreateContractDto,
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const contract = await this.contractsService.create(dto, userId);
    res.status(HttpStatus.CREATED);
    return {
      ...contract,
      __audit: {
        action: 'contract.create',
        entityType: 'Contract',
        entityId: contract.id,
        changes: { status: contract.status },
      },
    };
  }

  @Post(':id/sign')
  @HttpCode(200)
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async sign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SignContractDto,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ) {
    const contract = await this.contractsService.sign(
      id,
      dto,
      userId,
      req.ip ?? '0.0.0.0',
    );
    return {
      ...contract,
      __audit: {
        action: 'contract.sign',
        entityType: 'Contract',
        entityId: id,
        changes: {
          signatureType: dto.signatureType,
          status: contract.status,
        },
      },
    };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async findAll() {
    return this.contractsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.findOne(id);
  }

  @Get('rental/:rentalId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async findByRental(@Param('rentalId', ParseUUIDPipe) rentalId: string) {
    return this.contractsService.findByRental(rentalId);
  }

  @Get(':id/pdf')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async downloadPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const contract = await this.contractsService.findOne(id);
    if (!contract.pdfKey) {
      throw new NotFoundException('PDF not yet generated for this contract');
    }
    const url = await this.storageService.getPresignedDownloadUrl(
      contract.pdfKey,
    );
    res.redirect(url);
  }
}
