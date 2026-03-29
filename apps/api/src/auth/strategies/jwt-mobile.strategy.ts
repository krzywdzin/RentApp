import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '@rentapp/shared';

@Injectable()
export class MobileJwtStrategy extends PassportStrategy(Strategy, 'jwt-mobile') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_MOBILE_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.aud !== 'mobile') {
      throw new UnauthorizedException('Invalid token audience');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }
    return { id: user.id, email: user.email, role: user.role, name: user.name };
  }
}
