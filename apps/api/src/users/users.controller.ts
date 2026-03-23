import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { UserRole } from '@rentapp/shared';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
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
  getMe(@CurrentUser() user: any) {
    return user;
  }
}
