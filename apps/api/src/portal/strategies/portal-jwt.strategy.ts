import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PortalJwtStrategy extends PassportStrategy(Strategy, 'portal-jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('PORTAL_JWT_SECRET')!,
    });
  }

  async validate(payload: { sub: string; type: string; customerId?: string; iat?: number; exp?: number }) {
    // Only accept portal-type tokens
    if (payload.type !== 'portal') return null;
    return { customerId: payload.sub, type: 'portal' };
  }
}
