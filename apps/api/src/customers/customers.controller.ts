import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserRole } from '@rentapp/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { SearchCustomerDto } from './dto/search-customer.dto';
import { CustomersQueryDto } from './dto/customers-query.dto';

@Controller('customers')
@Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Post()
  async create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Get('search')
  async search(@Query() dto: SearchCustomerDto) {
    return this.customersService.search(dto);
  }

  @Get()
  async findAll(@Query() query: CustomersQueryDto) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const { oldValues, customer } = await this.customersService.update(id, dto);
    return {
      ...customer,
      __audit: {
        action: 'customer.update',
        entityType: 'Customer',
        entityId: id,
        changes: oldValues,
      },
    };
  }

  @Patch(':id/archive')
  async archive(@Param('id', ParseUUIDPipe) id: string) {
    const customer = await this.customersService.archive(id);
    return {
      ...customer,
      __audit: {
        action: 'customer.archive',
        entityType: 'Customer',
        entityId: id,
        changes: { isArchived: { old: false, new: true } },
      },
    };
  }
}
