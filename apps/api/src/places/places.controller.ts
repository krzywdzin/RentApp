import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@rentapp/shared';
import { PlacesService } from './places.service';

@Controller('places')
@Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get('place/autocomplete/json')
  async autocomplete(
    @Query('input') input?: string,
    @Query('sessiontoken') sessionToken?: string,
  ) {
    // Return empty result for missing or short input
    if (!input || input.length < 2) {
      return { predictions: [], status: 'OK' };
    }

    return this.placesService.autocomplete(input, sessionToken);
  }
}
