import { Controller, Get, Req, Param, UseGuards } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PortalAuthGuard } from './guards/portal-auth.guard';
import { PortalService } from './portal.service';

@Controller('portal')
@Public() // Bypass JwtAuthGuard (global guard) -- PortalAuthGuard handles auth
@UseGuards(PortalAuthGuard)
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('me')
  async getMe(@Req() req: any) {
    return this.portalService.getCustomerInfo(req.user.customerId);
  }

  @Get('rentals')
  async getRentals(@Req() req: any) {
    return this.portalService.getRentals(req.user.customerId);
  }

  @Get('rentals/:id')
  async getRentalDetail(@Req() req: any, @Param('id') id: string) {
    return this.portalService.getRentalDetail(req.user.customerId, id);
  }
}
