import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PortalService } from './portal.service';
import { PortalController } from './portal.controller';
import { PortalAuthController } from './portal-auth.controller';
import { PortalJwtStrategy } from './strategies/portal-jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('PORTAL_JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [PortalAuthController, PortalController],
  providers: [PortalService, PortalJwtStrategy],
  exports: [PortalService],
})
export class PortalModule {}
