import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { validateEnvironment } from './common/env.validation';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  // Validate environment BEFORE creating the app
  validateEnvironment();

  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Enable graceful shutdown hooks (SIGTERM, SIGINT)
  app.enableShutdownHooks();
  logger.log('Shutdown hooks enabled — will shut down gracefully on SIGTERM/SIGINT');

  // Default body size limit — kept small to prevent abuse
  // Routes needing larger payloads (e.g., signature base64) use route-level overrides
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.use(helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"] } },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  }));

  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3001')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
