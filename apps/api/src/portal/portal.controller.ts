import { Controller, Get, Req, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { PortalAuthGuard } from './guards/portal-auth.guard';
import { PortalService } from './portal.service';

interface PortalRequest extends Request {
  user: {
    customerId: string;
    sub: string;
  };
}

@Controller('portal')
@Public() // Bypass JwtAuthGuard (global guard) -- PortalAuthGuard handles auth
@UseGuards(PortalAuthGuard)
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('me')
  async getMe(@Req() req: PortalRequest) {
    return this.portalService.getCustomerInfo(req.user.customerId);
  }

  @Get('rentals')
  async getRentals(@Req() req: PortalRequest) {
    return this.portalService.getRentals(req.user.customerId);
  }

  @Get('rentals/:id')
  async getRentalDetail(@Req() req: PortalRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.portalService.getRentalDetail(req.user.customerId, id);
  }
}
