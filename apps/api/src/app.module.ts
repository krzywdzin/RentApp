import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditModule } from './audit/audit.module';
import { AuditInterceptor } from './audit/audit.interceptor';
import { StorageModule } from './storage/storage.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { CustomersModule } from './customers/customers.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RentalsModule } from './rentals/rentals.module';
import { ContractsModule } from './contracts/contracts.module';
import { PhotosModule } from './photos/photos.module';
import { BullModule } from '@nestjs/bull';
import { NotificationsModule } from './notifications/notifications.module';
import { AlertConfigModule } from './alert-config/alert-config.module';
import { CepikModule } from './cepik/cepik.module';
import { PortalModule } from './portal/portal.module';
import { HealthModule } from './health/health.module';
import { VehicleClassesModule } from './vehicle-classes/vehicle-classes.module';
import { SettingsModule } from './settings/settings.module';
import { RentalDriversModule } from './rental-drivers/rental-drivers.module';
import { PlacesModule } from './places/places.module';
import { DocumentsModule } from './documents/documents.module';
import { ReturnProtocolsModule } from './return-protocols/return-protocols.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    UsersModule,
    MailModule,
    AuditModule,
    StorageModule,
    VehiclesModule,
    CustomersModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    RentalsModule,
    ContractsModule,
    PhotosModule,
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const redisUrl = config.getOrThrow<string>('REDIS_URL');
        const isTls = redisUrl.startsWith('rediss://');
        return {
          url: redisUrl,
          redis: isTls ? { tls: { rejectUnauthorized: false } } : undefined,
        };
      },
      inject: [ConfigService],
    }),
    NotificationsModule,
    AlertConfigModule,
    CepikModule,
    PortalModule,
    HealthModule,
    VehicleClassesModule,
    SettingsModule,
    RentalDriversModule,
    PlacesModule,
    DocumentsModule,
    ReturnProtocolsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
