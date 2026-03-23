import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RentalsService } from './rentals.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RentalsService', () => {
  let service: RentalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RentalsService,
        { provide: PrismaService, useValue: {} },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<RentalsService>(RentalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Creation ---
  it.todo('should create a rental in DRAFT status');
  it.todo('should create a rental in ACTIVE status when requested');
  it.todo('should calculate pricing from daily rate');
  it.todo('should calculate pricing from total price');
  it.todo('should detect overlapping rentals');
  it.todo('should allow creation with override when overlap exists');

  // --- State machine ---
  it.todo('should transition DRAFT to ACTIVE');
  it.todo('should reject invalid transitions');
  it.todo('should allow admin rollback');
  it.todo('should reject non-admin rollback transitions');

  // --- Return ---
  it.todo('should process return with mileage');
  it.todo('should process return with inspection data');
  it.todo('should include handover data in return response');

  // --- Extension ---
  it.todo('should extend rental with cost recalculation');
  it.todo('should reject employee extend attempt');

  // --- Calendar ---
  it.todo('should return calendar data grouped by vehicle');
});
