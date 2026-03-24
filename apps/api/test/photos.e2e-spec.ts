import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

describe('Photos (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Will be set up in Plan 02 with full AppModule
  });

  afterAll(async () => {
    await app?.close();
  });

  it.todo('POST /walkthroughs creates a walkthrough');
  it.todo('POST /walkthroughs/:id/photos uploads a photo');
  it.todo('POST /walkthroughs/:id/submit validates completeness');
  it.todo('GET /rentals/:id/comparison returns side-by-side data');
  it.todo('PUT /walkthroughs/:id/photos/:position replaces photo within edit window');
  it.todo('rejects photo upload for non-existent walkthrough');
  it.todo('rejects unauthorized access (CUSTOMER role)');
});
