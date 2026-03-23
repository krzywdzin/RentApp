import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/mail/mail.service';
import { StorageService } from '../src/storage/storage.service';

describe('Rentals (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue({
        sendSetupPasswordEmail: jest.fn(),
        sendResetPasswordEmail: jest.fn(),
      })
      .overrideProvider(StorageService)
      .useValue({
        upload: jest.fn().mockResolvedValue('mock-key'),
        getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://mock-presigned-url'),
        delete: jest.fn().mockResolvedValue(undefined),
        onModuleInit: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app?.close();
  });

  // --- CRUD ---
  it.todo('POST /rentals — should create rental');
  it.todo('POST /rentals — should warn on overlap');
  it.todo('POST /rentals — should allow override on overlap');
  it.todo('GET /rentals — should list rentals');
  it.todo('GET /rentals/calendar — should return vehicle-grouped calendar');
  it.todo('GET /rentals/:id — should return rental by id');

  // --- State transitions ---
  it.todo('PATCH /rentals/:id/activate — should activate draft rental');
  it.todo('PATCH /rentals/:id/activate — should reject invalid transition');
  it.todo('PATCH /rentals/:id/return — should process return');
  it.todo('PATCH /rentals/:id/extend — should extend rental (admin)');
  it.todo('PATCH /rentals/:id/extend — should reject extend (employee)');
  it.todo('PATCH /rentals/:id/rollback — should rollback status (admin)');
});
