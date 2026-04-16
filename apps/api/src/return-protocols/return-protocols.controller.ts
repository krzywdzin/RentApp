import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@rentapp/shared';
import { ReturnProtocolsService } from './return-protocols.service';
import { CreateReturnProtocolDto } from './dto/create-return-protocol.dto';

@Controller('return-protocols')
@Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
export class ReturnProtocolsController {
  constructor(private readonly service: ReturnProtocolsService) {}

  @Post()
  async create(
    @Body() dto: CreateReturnProtocolDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.create(dto, userId);
  }

  @Get(':rentalId')
  async findByRentalId(@Param('rentalId') rentalId: string) {
    const protocol = await this.service.findByRentalId(rentalId);
    if (!protocol) {
      throw new NotFoundException('Protocol not found for this rental');
    }
    return protocol;
  }

  @Get(':rentalId/download')
  async getDownloadUrl(@Param('rentalId') rentalId: string) {
    const url = await this.service.getDownloadUrl(rentalId);
    return { url };
  }
}
