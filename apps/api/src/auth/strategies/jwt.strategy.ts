import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload, UserRole } from '@rentapp/shared';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    // Mobile tokens must use jwt-mobile strategy, not this one
    if (payload.aud === 'mobile') {
      throw new UnauthorizedException('Invalid token: use mobile authentication');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    // Enforce that only ADMIN role can use admin context tokens
    // This is defense-in-depth: login() already validates this,
    // but we check again in case a token was issued before the fix
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Access denied: Admin panel requires administrator role');
    }

    return { id: user.id, email: user.email, role: user.role, name: user.name };
  }
}
