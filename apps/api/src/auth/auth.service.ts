import { Injectable, Logger, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@rentapp/shared';

const ARGON2_OPTIONS = { memoryCost: 32768, timeCost: 3, parallelism: 1 };
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_TTL = 900; // 15 minutes in seconds
const REFRESH_TOKEN_TTL = 86400; // 24 hours in seconds

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private redis: Redis;
  private redisAvailable = true;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {
    this.redis = new Redis(this.config.get<string>('REDIS_URL')!);
    this.redis.on('error', (err) => {
      this.redisAvailable = false;
      this.logger.error('Redis connection error', err.stack);
    });
    this.redis.on('ready', () => {
      this.redisAvailable = true;
    });
  }

  /**
   * Safely execute a Redis command. Returns null on failure instead of throwing.
   * This prevents Redis outages (e.g., Upstash request limit) from breaking auth.
   */
  private async safeRedis<T>(operation: () => Promise<T>, context: string): Promise<T | null> {
    try {
      return await operation();
    } catch (err: any) {
      this.logger.warn(`Redis operation failed (${context}): ${err.message}`);
      return null;
    }
  }

  async validateUser(login: string, password: string) {
    // Rate-limiting is best-effort: if Redis is down, skip lockout check
    const lockout = await this.safeRedis(
      () => this.redis.get(`lockout:${login}`),
      'lockout-check',
    );
    if (lockout) {
      this.logger.warn(`Login rejected: account locked for ${login}`);
      throw new UnauthorizedException(
        'Account locked. Try again in 15 minutes.',
      );
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: login },
          { username: login },
        ],
      },
    });
    if (!user || !user.passwordHash) {
      await this.trackFailedAttempt(login);
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      await this.trackFailedAttempt(login);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Clear failed attempts (best-effort)
    await this.safeRedis(
      () => this.redis.del(`attempts:${login}`),
      'clear-attempts',
    );
    this.logger.log(`Login successful for ${login}`);

    const { passwordHash, setupToken, setupTokenExpiry, ...result } = user;
    return result;
  }

  private async trackFailedAttempt(identifier: string): Promise<void> {
    // Rate-limiting is best-effort: if Redis is unavailable, we still reject
    // the login attempt but skip the lockout tracking
    const count = await this.safeRedis(
      () => this.redis.incr(`attempts:${identifier}`),
      'track-attempt',
    );
    if (count === null) return; // Redis unavailable, skip tracking

    await this.safeRedis(
      () => this.redis.expire(`attempts:${identifier}`, LOCKOUT_TTL),
      'expire-attempts',
    );
    this.logger.warn(`Failed login attempt for ${identifier} (attempt ${count})`);

    if (count >= MAX_FAILED_ATTEMPTS) {
      await this.safeRedis(
        () => this.redis.setex(`lockout:${identifier}`, LOCKOUT_TTL, '1'),
        'set-lockout',
      );
      await this.safeRedis(
        () => this.redis.del(`attempts:${identifier}`),
        'clear-locked-attempts',
      );
      this.logger.warn(
        `Account locked: ${identifier} after ${MAX_FAILED_ATTEMPTS} failed attempts`,
      );
    }
  }

  async login(userId: string, deviceId: string, context: 'admin' | 'mobile' = 'admin') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Validate role matches context
    // ADMIN can access both web and mobile
    // EMPLOYEE can only access mobile
    if (context === 'admin' && user.role !== UserRole.ADMIN) {
      this.logger.warn(`Access denied: ${user.email} (${user.role}) attempted admin context login`);
      throw new ForbiddenException('Access denied: Admin panel requires administrator role');
    }

    const payload = { sub: userId, role: user.role, aud: context };
    const secret = context === 'mobile'
      ? (this.config.get<string>('JWT_MOBILE_SECRET') ?? this.config.get<string>('JWT_ACCESS_SECRET'))
      : this.config.get<string>('JWT_ACCESS_SECRET');
    const accessToken = this.jwtService.sign(payload, {
      secret,
      expiresIn: '30m',
    });

    const rawRefresh = crypto.randomBytes(40).toString('base64url');
    const hashedRefresh = await argon2.hash(rawRefresh, ARGON2_OPTIONS);

    // Store refresh token in Redis (best-effort: login succeeds even if Redis is down)
    const stored = await this.safeRedis(
      () => this.redis.setex(
        `refresh:${userId}:${deviceId}`,
        REFRESH_TOKEN_TTL,
        hashedRefresh,
      ),
      'store-refresh-token',
    );
    if (!stored) {
      this.logger.warn(`Refresh token could not be stored in Redis for user ${userId} — token refresh will not work until Redis recovers`);
    }

    return { accessToken, refreshToken: rawRefresh, deviceId };
  }

  async refresh(userId: string, deviceId: string, rawToken: string, context: 'admin' | 'mobile' = 'admin') {
    const stored = await this.safeRedis(
      () => this.redis.get(`refresh:${userId}:${deviceId}`),
      'refresh-get-token',
    );
    if (!stored) {
      throw new UnauthorizedException('Session expired');
    }

    const valid = await argon2.verify(stored, rawToken);
    if (!valid) {
      // Token reuse detected -- invalidate all sessions for this user
      this.logger.warn(
        `Token reuse detected for user ${userId}, invalidating all sessions`,
      );
      const keys = await this.safeRedis(
        () => this.redis.keys(`refresh:${userId}:*`),
        'refresh-reuse-keys',
      );
      if (keys && keys.length > 0) {
        await this.safeRedis(
          () => this.redis.del(...keys),
          'refresh-reuse-del',
        );
      }
      throw new UnauthorizedException('Token reuse detected');
    }

    // Delete old token and issue new pair
    await this.safeRedis(
      () => this.redis.del(`refresh:${userId}:${deviceId}`),
      'refresh-del-old-token',
    );
    return this.login(userId, deviceId, context);
  }

  async setupPassword(token: string, password: string) {
    const identifier = token.slice(0, 8);
    const matchedUser = await this.prisma.user.findFirst({
      where: {
        setupTokenIdentifier: identifier,
        setupToken: { not: null },
        setupTokenExpiry: { gt: new Date() },
      },
    });

    if (!matchedUser) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const isMatch = await argon2.verify(matchedUser.setupToken!, token);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);

    await this.prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        passwordHash,
        setupToken: null,
        setupTokenIdentifier: null,
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
    await this.safeRedis(
      () => this.redis.del(`refresh:${userId}:${deviceId}`),
      'logout',
    );
    return { message: 'Logged out successfully' };
  }
}
