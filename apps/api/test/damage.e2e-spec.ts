import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

describe('Damage Reports (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Will be set up in Plan 02 with full AppModule
  });

  afterAll(async () => {
    await app?.close();
  });

  it.todo('POST /damage-reports creates a damage report');
  it.todo('POST /damage-reports/:walkthroughId/pins adds a pin');
  it.todo('DELETE /damage-reports/:walkthroughId/pins/:pinNumber removes a pin');
  it.todo('POST /damage-reports/:walkthroughId/no-damage confirms no damage');
  it.todo('GET /damage-reports/comparison/:rentalId returns comparison');
  it.todo('rejects damage report with invalid pin coordinates');
});
