import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PlacesService {
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_PLACES_API_KEY', '');
  }

  async autocomplete(
    input: string,
    sessionToken?: string,
  ): Promise<Record<string, unknown>> {
    if (!this.apiKey) {
      throw new HttpException('Google Places API key not configured', 503);
    }
    const params = new URLSearchParams({
      input,
      key: this.apiKey,
      components: 'country:pl',
      language: 'pl',
      types: 'address',
    });

    if (sessionToken) {
      params.set('sessiontoken', sessionToken);
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      throw new HttpException('Google Places API request failed', 502);
    }

    if (!response.ok) {
      throw new HttpException(
        `Google Places API returned ${response.status}`,
        502,
      );
    }

    return response.json();
  }
}
