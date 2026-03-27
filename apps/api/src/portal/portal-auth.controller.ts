import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { PortalService } from './portal.service';
import { TokenExchangeDto } from './dto/token-exchange.dto';

@Controller('portal/auth')
export class PortalAuthController {
  constructor(private readonly portalService: PortalService) {}

  @Public()
  @Post('exchange')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async exchange(@Body() dto: TokenExchangeDto) {
    return this.portalService.exchangeToken(dto.customerId, dto.token);
  }
}
