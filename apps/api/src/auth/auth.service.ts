import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';

const ARGON2_OPTIONS = { memoryCost: 32768, timeCost: 3, parallelism: 1 };
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_TTL = 900; // 15 minutes in seconds
const REFRESH_TOKEN_TTL = 86400; // 24 hours in seconds

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private redis: Redis;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {
    this.redis = new Redis(this.config.get<string>('REDIS_URL')!);
    this.redis.on('error', (err) =>
      this.logger.error('Redis connection error', err.stack),
    );
  }

  async validateUser(email: string, password: string) {
    const lockout = await this.redis.get(`lockout:${email}`);
    if (lockout) {
      this.logger.warn(`Login rejected: account locked for ${email}`);
      throw new UnauthorizedException(
        'Account locked. Try again in 15 minutes.',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      await this.trackFailedAttempt(email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      await this.trackFailedAttempt(email);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.redis.del(`attempts:${email}`);
    this.logger.log(`Login successful for ${email}`);

    const { passwordHash, setupToken, setupTokenExpiry, ...result } = user;
    return result;
  }

  private async trackFailedAttempt(email: string): Promise<void> {
    const count = await this.redis.incr(`attempts:${email}`);
    await this.redis.expire(`attempts:${email}`, LOCKOUT_TTL);
    this.logger.warn(`Failed login attempt for ${email} (attempt ${count})`);

    if (count >= MAX_FAILED_ATTEMPTS) {
      await this.redis.setex(`lockout:${email}`, LOCKOUT_TTL, '1');
      await this.redis.del(`attempts:${email}`);
      this.logger.warn(
        `Account locked: ${email} after ${MAX_FAILED_ATTEMPTS} failed attempts`,
      );
    }
  }

  async login(userId: string, deviceId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = { sub: userId, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '30m',
    });

    const rawRefresh = crypto.randomBytes(40).toString('base64url');
    const hashedRefresh = await argon2.hash(rawRefresh, ARGON2_OPTIONS);

    await this.redis.setex(
      `refresh:${userId}:${deviceId}`,
      REFRESH_TOKEN_TTL,
      hashedRefresh,
    );

    return { accessToken, refreshToken: rawRefresh, deviceId };
  }

  async refresh(userId: string, deviceId: string, rawToken: string) {
    const stored = await this.redis.get(`refresh:${userId}:${deviceId}`);
    if (!stored) {
      throw new UnauthorizedException('Session expired');
    }

    const valid = await argon2.verify(stored, rawToken);
    if (!valid) {
      // Token reuse detected -- invalidate all sessions for this user
      this.logger.warn(
        `Token reuse detected for user ${userId}, invalidating all sessions`,
      );
      const keys = await this.redis.keys(`refresh:${userId}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      throw new UnauthorizedException('Token reuse detected');
    }

    // Delete old token and issue new pair
    await this.redis.del(`refresh:${userId}:${deviceId}`);
    return this.login(userId, deviceId);
  }

  async setupPassword(token: string, password: string) {
    const users = await this.prisma.user.findMany({
      where: {
        setupToken: { not: null },
        setupTokenExpiry: { gt: new Date() },
      },
    });

    let matchedUser = null;
    for (const user of users) {
      try {
        const isMatch = await argon2.verify(user.setupToken!, token);
        if (isMatch) {
          matchedUser = user;
          break;
        }
      } catch {
        // hash verification failed, continue
      }
    }

    if (!matchedUser) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);

    await this.prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        passwordHash,
        setupToken: null,
        setupTokenExpiry: null,
      },
    });

    return { message: 'Password set successfully' };
  }

  async resetPassword(token: string, password: string) {
    // Reuses same token-based flow as setupPassword
    return this.setupPassword(token, password);
  }

  async logout(userId: string, deviceId: string) {
    await this.redis.del(`refresh:${userId}:${deviceId}`);
    return { message: 'Logged out successfully' };
  }
}
