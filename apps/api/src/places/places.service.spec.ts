import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { PlacesService } from './places.service';

describe('PlacesService', () => {
  let service: PlacesService;
  let configService: ConfigService;

  const MOCK_API_KEY = 'test-google-api-key';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlacesService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue(MOCK_API_KEY),
          },
        },
      ],
    }).compile();

    service = module.get<PlacesService>(PlacesService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset global fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call Google API with correct URL params', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        predictions: [{ description: 'Torun, Poland', place_id: 'abc123' }],
        status: 'OK',
      }),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    await service.autocomplete('Torun');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;

    expect(calledUrl).toContain('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    expect(calledUrl).toContain(`key=${MOCK_API_KEY}`);
    expect(calledUrl).toContain('input=Torun');
    expect(calledUrl).toContain('components=country%3Apl');
    expect(calledUrl).toContain('language=pl');
    expect(calledUrl).toContain('types=address');
  });

  it('should include sessiontoken when provided', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ predictions: [], status: 'OK' }),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    await service.autocomplete('Torun', 'session-token-123');

    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('sessiontoken=session-token-123');
  });

  it('should return raw Google response JSON (predictions array)', async () => {
    const googleResponse = {
      predictions: [
        { description: 'Torun, Poland', place_id: 'abc123' },
        { description: 'Torunska, Poland', place_id: 'def456' },
      ],
      status: 'OK',
    };
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(googleResponse),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await service.autocomplete('Torun');

    expect(result).toEqual(googleResponse);
  });

  it('should throw HttpException(502) on non-OK HTTP response', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    await expect(service.autocomplete('Torun')).rejects.toThrow(HttpException);
    await expect(service.autocomplete('Torun')).rejects.toMatchObject({
      status: 502,
    });
  });

  it('should throw HttpException(502) on fetch failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    await expect(service.autocomplete('Torun')).rejects.toThrow(HttpException);
  });
});
