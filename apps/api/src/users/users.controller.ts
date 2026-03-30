import { Controller, Post, Get, Patch, Delete, Param, Body, Query, ParseUUIDPipe } from '@nestjs/common';
import { UserRole } from '@rentapp/shared';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.usersService.createUser(dto, user.id);
  }

  @Get('me')
  getMe(@CurrentUser() user: { id: string; email: string; role: string; name: string }) {
    return user;
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@Query('filter') filter?: string) {
    const validFilters = ['active', 'archived', 'all'] as const;
    const f = validFilters.includes(filter as typeof validFilters[number])
      ? (filter as 'active' | 'archived' | 'all')
      : 'active';
    return this.usersService.findAll(f);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, dto);
  }

  @Post(':id/reset-password')
  @Roles(UserRole.ADMIN)
  async resetPassword(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.resetPasswordByAdmin(id);
    return { success: true };
  }

  @Patch(':id/archive')
  @Roles(UserRole.ADMIN)
  async archive(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.archive(id);
    return {
      ...user,
      __audit: {
        action: 'user.archive',
        entityType: 'User',
        entityId: id,
        changes: { isArchived: { old: false, new: true }, isActive: { old: true, new: false } },
      },
    };
  }

  @Patch(':id/unarchive')
  @Roles(UserRole.ADMIN)
  async unarchive(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.unarchive(id);
    return {
      ...user,
      __audit: {
        action: 'user.unarchive',
        entityType: 'User',
        entityId: id,
        changes: { isArchived: { old: true, new: false }, isActive: { old: false, new: true } },
      },
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.usersService.hardDelete(id);
    return {
      ...result,
      __audit: {
        action: 'user.delete',
        entityType: 'User',
        entityId: id,
      },
    };
  }
}
