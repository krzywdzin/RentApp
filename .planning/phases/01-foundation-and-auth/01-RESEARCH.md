# Phase 1: Foundation and Auth - Research

**Researched:** 2026-03-23
**Domain:** NestJS monorepo scaffold, Prisma database schema, JWT authentication with roles, immutable audit trail
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Monorepo:** Turborepo with structure: `apps/api`, `apps/web`, `apps/mobile`, `packages/shared`
- **Package manager:** pnpm
- **Node.js:** v22 LTS
- **Local dependencies:** Docker Compose (PostgreSQL 16, Redis 7, MinIO) — one `docker-compose up` starts everything
- **Shared package:** TypeScript types + Zod validation schemas shared between all apps — prevents API/client contract drift
- **Linting/formatting:** ESLint + Prettier with shared config
- **Target hosting:** Railway (PaaS)
- **Session duration:** 24 hours — daily re-login required
- **Failed login:** Account locked for 15 minutes after 5 failed attempts
- **Password policy:** Minimum 8 characters, no forced complexity (NIST approach)
- **Account creation:** Admin creates employee accounts → employee receives email with password setup link
- **Multi-device:** Allowed — employee can be logged in on phone + laptop simultaneously
- **Admin:** Full access to everything — all CRUD, audit trail, account management, system settings
- **Employee:** Can create/edit rentals and customers, read-only access to vehicles, no audit trail access, no account management
- **Customer:** Magic link access (no password) — read-only portal (Phase 9), token-based auth with expiry
- **Public endpoints:** None — all endpoints require authentication
- **Audit scope:** All mutations (create/update/delete) on every entity
- **Audit detail:** Full diff — old value → new value for every changed field
- **Audit retention:** Indefinite — logs are never deleted
- **Audit access:** Admin-only in admin panel
- **Audit implementation:** NestJS interceptor pattern — automatic, no manual logging per endpoint
- **Audit immutability:** Append-only table, no update/delete operations on audit records

### Claude's Discretion
- JWT token structure (access + refresh token strategy)
- Database migration tooling (Prisma Migrate)
- Exact Docker Compose service configuration
- Redis usage patterns (sessions, caching, or both)
- CI/CD pipeline details
- Test framework selection

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Pracownik/admin może zalogować się emailem i hasłem | NestJS Passport LocalStrategy for credential validation; argon2 password verification; `POST /auth/login` returns access + refresh tokens; Redis-backed lockout after 5 failures |
| AUTH-02 | Pracownik może zresetować hasło przez link email | Admin-created account flow: generate random token, hash and store with expiry, queue email job with raw token link; employee clicks link and sets password; same token mechanism for password reset |
| AUTH-03 | Sesja użytkownika utrzymuje się po odświeżeniu przeglądarki/aplikacji | Short-lived access JWT (30min) + 24h refresh token in Redis keyed by userId:deviceId; `POST /auth/refresh` issues new pair; multi-device supported by separate Redis keys per device |
| AUTH-04 | System rozróżnia role: admin, pracownik, klient | Prisma enum `UserRole { ADMIN EMPLOYEE CUSTOMER }`; `@Roles()` decorator + `RolesGuard`; `JwtAuthGuard` as global default guard; `@Public()` decorator for login/refresh endpoints |
| AUTH-05 | Każda mutacja w systemie jest logowana w audit trailu — log niezmienny | `AuditInterceptor` on all POST/PATCH/PUT/DELETE; captures actorId + IP from request.user; writes diff to `audit_logs` append-only table; DB user lacks UPDATE/DELETE on audit_logs |
</phase_requirements>

---

## Summary

Phase 1 establishes the entire foundation on which the remaining 8 phases build. The work has three distinct pillars: (1) the Turborepo monorepo scaffold with Docker dev environment, (2) the Prisma database schema with User and audit_logs tables, and (3) the NestJS auth module plus interceptor-based audit trail. Every subsequent phase either extends the Prisma schema or consumes the auth guards and audit interceptor — correctness here prevents costly rework later.

The stack is well-established and all packages are current on npm (versions verified March 2026). NestJS 11 with `@nestjs/passport`, `@nestjs/jwt`, and Prisma 7.5 are the canonical choices. The recommended auth strategy is access token + refresh token pair: a short-lived JWT (30 min) plus a Redis-backed refresh token valid for 24 hours. This satisfies AUTH-03 (session persistence) while keeping access tokens stateless and enabling logout/lockout. Multi-device login is handled by keying refresh tokens as `refresh:{userId}:{deviceId}` — each device gets its own token entry, and all coexist in Redis.

The one non-obvious design decision with significant downstream impact is field-level encryption for PII. RODO/GDPR requires AES-256-GCM encryption for PESEL, ID numbers, and license numbers — enforced by UODO with documented fines (ING Bank 18M PLN, Glovo 5.9M PLN). This must be scaffolded in Phase 1 during schema setup even though Customer entity comes in Phase 2. Creating the encryption utility now means Phase 2 just calls `encrypt()` — retrofitting it later requires a data migration.

**Primary recommendation:** Scaffold Turborepo first, then establish Prisma schema (User + AuditLog + encryption helper), then build NestJS auth module (login, refresh, roles), then wire up the audit interceptor. In parallel, submit the CEPiK API application and register the SMSAPI sender ID (both multi-week external processes).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NestJS | 11.1.17 | Backend framework | Modules/controllers/services pattern; built-in DI; interceptors and guards are the canonical NestJS way to implement auth and audit trail |
| @nestjs/passport | 11.0.5 | Passport.js integration | Official NestJS adapter; `AuthGuard('jwt')` and `AuthGuard('local')` strategy wrappers |
| @nestjs/jwt | 11.0.2 | JWT sign/verify | Official NestJS JWT module wrapping jsonwebtoken with DI-friendly API |
| passport-jwt | 4.0.1 | JWT Passport strategy | Extracts and validates JWT from Authorization header |
| @nestjs/config | 4.0.3 | Environment config | Official env management; validates all env vars on startup with Joi schema |
| Prisma | 7.5.0 | ORM + migrations | Pure TypeScript (Rust engine dropped in v7). Schema-first. `prisma migrate dev` for migrations |
| @prisma/client | 7.5.0 | Generated DB client | Type-safe DB access auto-generated from schema |
| argon2 | 0.44.0 | Password hashing | Argon2id is the NIST/OWASP recommended algorithm over bcrypt; memory-hard, GPU-resistant |
| ioredis | 5.10.1 | Redis client | Full-featured Redis client; used for refresh token storage and login attempt tracking |
| @nestjs/throttler | 6.5.0 | Rate limiting | Official NestJS rate limiter; complements Redis-based lockout |
| bullmq | 5.71.0 | Job queue | Redis-backed async queue; used in Phase 1 for sending password setup emails |
| @nestjs/bull | 11.0.4 | BullMQ NestJS adapter | Official decorator-based BullMQ integration |
| helmet | 8.1.0 | HTTP security headers | One-line security baseline for Express; prevents common web vulnerabilities |
| class-validator | 0.15.1 | DTO validation | NestJS built-in validation pipe uses this; decorator-based |
| class-transformer | 0.5.1 | DTO transformation | Converts plain objects to class instances; pairs with class-validator |
| zod | 4.3.6 | Shared schemas | Used in `packages/shared` for types shared across API/web/mobile |
| nodemailer | 8.0.3 | Email sending | Sends password setup and reset emails |
| uuid | 13.0.0 | Device ID generation | Cryptographically random device UUIDs for multi-device refresh token tracking |
| turbo (Turborepo) | 2.8.20 | Monorepo build tool | Parallel builds, task caching, pipeline configuration across packages |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| bcrypt | 6.0.0 | Alternative password hasher | Only if argon2 native compilation fails on Railway; pure JS fallback |
| typescript | 5.9.3 | Type system | Shared `tsconfig.base.json` at repo root, extended by each package |
| next | 16.2.1 | Web app framework | `apps/web` scaffold only in this phase — no auth UI yet |
| @types/node | 25.5.0 | Node.js types | Dev dependency in all packages |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| argon2 | bcrypt | bcrypt still widely used; argon2id is the current OWASP/NIST recommendation for new systems. Choose argon2 here. |
| Redis refresh tokens | Database-stored tokens | DB tokens work but create read contention. Redis gives O(1) lookup and native TTL expiry — no cleanup job needed. |
| NestJS interceptor for audit | Prisma `$use` middleware | Prisma middleware captures DB-level diffs cleanly but loses HTTP context (actor IP, endpoint URL, user ID). NestJS interceptor is the right layer. |
| @nestjs/throttler | express-rate-limit | Throttler is NestJS-native with `@Throttle()` decorator support; express-rate-limit requires more wiring in a NestJS context. |

### Installation
```bash
# In apps/api
pnpm add @nestjs/core @nestjs/common @nestjs/platform-express @nestjs/passport @nestjs/jwt
pnpm add @nestjs/config @nestjs/throttler @nestjs/bull
pnpm add passport passport-jwt passport-local
pnpm add @prisma/client ioredis bullmq nodemailer uuid
pnpm add argon2 helmet class-validator class-transformer
pnpm add -D prisma @types/passport-jwt @types/passport-local @types/nodemailer @types/node typescript

# In packages/shared
pnpm add zod typescript
pnpm add -D @types/node
```

---

## Architecture Patterns

### Recommended Project Structure
```
rentapp/                          # Turborepo root
├── apps/
│   ├── api/                      # NestJS backend (Phase 1 primary deliverable)
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── auth/             # Login, refresh, password setup/reset
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.service.ts
│   │       │   ├── auth.module.ts
│   │       │   ├── strategies/
│   │       │   │   ├── jwt.strategy.ts
│   │       │   │   └── local.strategy.ts
│   │       │   └── dto/
│   │       │       ├── login.dto.ts
│   │       │       └── refresh-token.dto.ts
│   │       ├── users/            # User CRUD (admin creates employees)
│   │       │   ├── users.controller.ts
│   │       │   ├── users.service.ts
│   │       │   ├── users.module.ts
│   │       │   └── dto/
│   │       │       ├── create-user.dto.ts
│   │       │       └── setup-password.dto.ts
│   │       ├── audit/            # Audit trail interceptor + service
│   │       │   ├── audit.interceptor.ts
│   │       │   ├── audit.service.ts
│   │       │   └── audit.module.ts
│   │       ├── prisma/           # Prisma singleton service
│   │       │   ├── prisma.service.ts
│   │       │   └── prisma.module.ts
│   │       ├── mail/             # Email service (password setup)
│   │       │   ├── mail.service.ts
│   │       │   ├── mail.processor.ts  # BullMQ processor
│   │       │   └── mail.module.ts
│   │       ├── common/
│   │       │   ├── crypto/
│   │       │   │   └── field-encryption.ts  # AES-256-GCM for PII fields
│   │       │   ├── guards/
│   │       │   │   ├── jwt-auth.guard.ts    # Global default
│   │       │   │   └── roles.guard.ts       # @Roles() enforcement
│   │       │   ├── decorators/
│   │       │   │   ├── roles.decorator.ts   # @Roles(UserRole.ADMIN)
│   │       │   │   ├── public.decorator.ts  # @Public() skips JwtAuthGuard
│   │       │   │   └── current-user.decorator.ts
│   │       │   └── filters/
│   │       │       └── http-exception.filter.ts
│   │       └── app.module.ts
│   ├── web/                      # Next.js 16 scaffold (empty in Phase 1)
│   └── mobile/                   # Expo scaffold (empty in Phase 1)
├── packages/
│   └── shared/                   # Shared types + Zod schemas
│       ├── src/
│       │   ├── types/
│       │   │   └── user.types.ts  # UserRole enum, UserDto
│       │   ├── schemas/
│       │   │   └── auth.schemas.ts # LoginSchema, SetupPasswordSchema
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Pattern 1: Access Token + Refresh Token with Multi-Device Support
**What:** Issue two tokens on login: a short-lived access JWT (30 min) and a long-lived refresh token (24h, stored hashed in Redis). The client uses the access token for API calls. When it expires, the client calls `POST /auth/refresh` with the refresh token to get a new pair. Logout deletes the Redis entry.

**When to use:** Always. This satisfies AUTH-03 (session persists across browser refresh) and the CONTEXT.md 24h session decision without issuing 24h JWTs (which cannot be revoked).

**Multi-device:** Key refresh tokens as `refresh:{userId}:{deviceId}`. The client generates a UUID on first launch and stores it locally. Multiple devices coexist in Redis as separate keys.

**Refresh token rotation:** Each call to `/auth/refresh` issues a new pair and deletes the old token. If an already-rotated token is presented (possible token theft indicator), invalidate ALL tokens for that user.

```typescript
// auth.service.ts — login method
async login(userId: string, deviceId: string) {
  const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const payload = { sub: userId, role: user.role };

  const accessToken = this.jwtService.sign(payload, {
    secret: this.config.get('JWT_ACCESS_SECRET'),
    expiresIn: '30m',
  });

  // 40-byte raw refresh token (URL-safe base64)
  const rawRefresh = crypto.randomBytes(40).toString('base64url');
  const hashedRefresh = await argon2.hash(rawRefresh);

  const TTL_SECONDS = 86400; // 24h
  await this.redis.setex(`refresh:${userId}:${deviceId}`, TTL_SECONDS, hashedRefresh);

  return { accessToken, refreshToken: rawRefresh, deviceId };
}

// auth.service.ts — refresh method
async refresh(userId: string, deviceId: string, rawToken: string) {
  const stored = await this.redis.get(`refresh:${userId}:${deviceId}`);
  if (!stored) throw new UnauthorizedException('Session expired');

  const valid = await argon2.verify(stored, rawToken);
  if (!valid) {
    // Possible token reuse — nuke all devices for this user
    const keys = await this.redis.keys(`refresh:${userId}:*`);
    if (keys.length) await this.redis.del(...keys);
    throw new UnauthorizedException('Token reuse detected — all sessions invalidated');
  }

  // Rotate: delete old, issue new pair
  await this.redis.del(`refresh:${userId}:${deviceId}`);
  return this.login(userId, deviceId);
}
```

### Pattern 2: Redis-Based Login Lockout (AUTH-01)
**What:** Track failed login attempts per email in Redis. After 5 failures, set a lockout key with 15-minute TTL. Check lockout before attempting credential validation. This is separate from `@nestjs/throttler` (which handles general rate limiting).

```typescript
// auth.service.ts — validateUser method
async validateUser(email: string, password: string) {
  const lockKey = `lockout:${email}`;
  const locked = await this.redis.get(lockKey);
  if (locked) {
    throw new UnauthorizedException('Account locked. Try again in 15 minutes.');
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

  // Success — clear any previous attempt counter
  await this.redis.del(`attempts:${email}`);
  return user;
}

private async trackFailedAttempt(email: string) {
  const attemptsKey = `attempts:${email}`;
  const count = await this.redis.incr(attemptsKey);
  await this.redis.expire(attemptsKey, 900); // reset window after 15 min
  if (count >= 5) {
    await this.redis.setex(`lockout:${email}`, 900, '1'); // 15 min lockout
    await this.redis.del(attemptsKey);
  }
}
```

### Pattern 3: Admin-Created Account + Password Setup Flow (AUTH-02)
**What:** Admin calls `POST /users` (admin-only). Service creates user with `passwordHash: null` and a hashed setup token stored with 72h expiry. A BullMQ email job sends `{APP_URL}/setup-password?token={rawToken}`. Employee clicks, POSTs to `POST /auth/setup-password` with raw token + new password. Service hashes and compares, then sets the password and clears the token. Same mechanism serves password reset.

```typescript
// users.service.ts — createEmployee
async createEmployee(dto: CreateUserDto, adminId: string) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = await argon2.hash(rawToken);
  const expiry = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h

  const user = await this.prisma.user.create({
    data: {
      email: dto.email,
      name: dto.name,
      role: 'EMPLOYEE',
      passwordHash: null,
      setupToken: hashedToken,
      setupTokenExpiry: expiry,
    },
  });

  await this.mailQueue.add('send-setup-email', {
    to: user.email,
    name: user.name,
    token: rawToken,  // raw token goes in the email URL
  });

  return { id: user.id, email: user.email, name: user.name };
}
```

### Pattern 4: Global JwtAuthGuard with @Public() Escape Hatch (AUTH-04)
**What:** Register `JwtAuthGuard` as the global APP_GUARD in `app.module.ts`. All routes require auth by default. Routes that must be public (login, refresh, setup-password) use `@Public()` decorator. This prevents accidentally exposing endpoints without auth when a developer forgets to add the guard.

```typescript
// common/decorators/public.decorator.ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// common/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) { super(); }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}

// app.module.ts — providers array
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: RolesGuard },
  { provide: APP_FILTER, useClass: HttpExceptionFilter },
]

// Usage in auth.controller.ts
@Public()
@Post('login')
login(@Body() dto: LoginDto) { ... }
```

### Pattern 5: Audit Interceptor (AUTH-05)
**What:** `AuditInterceptor` intercepts all POST/PATCH/PUT/DELETE requests. It extracts the actor ID and IP from the request. After the handler returns, it reads the `__audit` metadata from the response to write to `audit_logs`. Services attach `__audit` to their return value.

**Phase 1 approach:** For simplicity in Phase 1 (only User entity is mutable), call `auditService.log()` directly from service methods. The interceptor-based approach will be standardized in Phase 2 when more entities exist. Design the AuditService interface now; wire the interceptor after patterns are proven.

```typescript
// audit/audit.service.ts
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(entry: {
    actorId: string | null;
    action: string;       // e.g. 'user.created', 'user.passwordSet'
    entityType: string;   // e.g. 'User'
    entityId: string;
    changes: Record<string, { old: unknown; new: unknown }>;
    ipAddress?: string;
  }) {
    // NOTE: This MUST be a separate write, not inside a transaction
    // with the mutation. If the mutation fails, the audit attempt
    // should still be recorded.
    await this.prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        changesJson: entry.changes,
        ipAddress: entry.ipAddress ?? null,
      },
    });
  }
}
```

### Pattern 6: PrismaService Singleton
```typescript
// prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}

// prisma/prisma.module.ts
@Global()  // Makes PrismaService available everywhere without re-importing
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### Anti-Patterns to Avoid
- **24h access tokens without refresh:** Satisfies "session lasts 24h" naively but makes logout and lockout impossible. Use short-lived access + refresh pattern.
- **Storing raw refresh tokens in Redis:** Always store the argon2 hash. A Redis breach should not expose usable tokens.
- **Role-checking inside service methods:** Authorization belongs in guards. Services should assume the caller is authorized. `if (user.role !== 'admin') throw` in a service is an anti-pattern.
- **Global audit interceptor intercepting GET requests:** Generates noise. Filter by HTTP method explicitly in the interceptor.
- **Audit logs inside the same DB transaction as the mutation:** If the mutation rolls back, the audit attempt should still exist. Use a separate, independent write.
- **argon2 default parameters on low-memory Railway instances:** Default `memoryCost` is 65536 KB (64MB). Railway starter plan has 512MB RAM. Use `{ memoryCost: 32768, timeCost: 3, parallelism: 1 }` (still above OWASP minimum of 19456 KB).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT sign/verify | Custom JWT implementation | @nestjs/jwt + jsonwebtoken | Token signing, algorithm negotiation, expiry claims — all handled. Custom implementations routinely have timing attack vulnerabilities. |
| Password hashing | MD5, SHA256, custom scheme | argon2 (argon2id) | Memory-hard KDF. OWASP and NIST recommended. bcrypt is acceptable but argon2id is the current standard for new systems. |
| Rate limiting | Manual Redis counter per route | @nestjs/throttler | Already tested, configurable per route via `@Throttle()` decorator. |
| Route guarding | Manual JWT decode middleware | @nestjs/passport JwtAuthGuard | Strategy pattern is testable, composable, and handles token extraction edge cases. |
| Email sending | Raw SMTP socket | nodemailer | Handles SMTP auth, TLS negotiation, MIME multipart, retry logic. |
| Env validation | Manual `process.env` checks | @nestjs/config with Joi | Validates all required env vars on startup with clear error messages. Prevents silent config failures. |
| Database migrations | Manual SQL files | Prisma Migrate | Schema diff, migration history, rollback, shadow database testing. |
| DB transactions | Manual BEGIN/COMMIT | Prisma `$transaction([...])` | Interactive transactions with auto-rollback on throw. Type-safe. |

**Key insight:** Auth and security have an enormous surface area for subtle bugs (timing attacks, token reuse, hash comparison with `===` instead of `timingSafeEqual`). Use vetted libraries that have addressed these already.

---

## Common Pitfalls

### Pitfall 1: PII Encryption Utility Not Scaffolded in Phase 1
**What goes wrong:** Phase 2 adds Customer entity with PESEL/ID/license fields as plain VARCHARs. Retrofitting encryption requires a data migration, potential schema changes, and possibly a UODO breach notification if any data was exposed.

**How to avoid:** Create `apps/api/src/common/crypto/field-encryption.ts` in Phase 1 with `encrypt(plaintext: string): EncryptedValue` and `decrypt(ciphertext: EncryptedValue): string` using Node.js built-in `crypto` with AES-256-GCM. Also create `hmacIndex(value: string): string` for searchable encrypted fields (e.g., PESEL search without decrypting all rows). Phase 2 just calls these utilities — no architecture change needed.

**Key choice (Claude's discretion):** Store encryption key in `FIELD_ENCRYPTION_KEY` env var (32-byte hex). Do NOT use the same key as JWT secrets. Railway supports env vars natively.

**Warning signs:** Any Phase 2 task that adds `pesel`, `idNumber`, or `licenseNumber` Prisma fields without referencing the encryption utility.

**Confidence:** HIGH — UODO enforcement documented (ING Bank 18M PLN, Glovo 5.9M PLN)

### Pitfall 2: Refresh Token Redis Key Collision Breaks Multi-Device
**What goes wrong:** Refresh tokens keyed as `refresh:{userId}` cause the second device login to overwrite the first device's token, logging it out — violating the multi-device CONTEXT.md decision.

**How to avoid:** Key as `refresh:{userId}:{deviceId}`. The client generates a UUID on first launch and stores it in localStorage (web) / AsyncStorage (mobile). This UUID is sent with every login and refresh call in the request body.

### Pitfall 3: argon2 Memory Cost Crashing Railway Starter Plan
**What goes wrong:** Default argon2 parameters use 64MB of RAM per hash. Under concurrent logins on a 512MB Railway container, the process OOMs and restarts.

**How to avoid:** Use `{ type: argon2.argon2id, memoryCost: 32768, timeCost: 3, parallelism: 1 }`. This is well above OWASP minimum (19456 KB) and uses ~32MB per operation. Test login latency — should be 100-300ms.

### Pitfall 4: Password Setup Token Stored as Plaintext in DB
**What goes wrong:** The raw token sent in the setup email URL is stored in `users.setupToken`. A DB read exposure allows attackers to take over any unactivated account.

**How to avoid:** Store the argon2 hash of the setup token in the DB. When the employee submits the token from the URL, hash it and compare to stored hash — exactly like password verification.

### Pitfall 5: All Endpoints Public by Default
**What goes wrong:** CONTEXT.md states "all endpoints require authentication." If JwtAuthGuard is only applied per-route, a new endpoint added without the decorator is accidentally public.

**How to avoid:** Register `JwtAuthGuard` as the global `APP_GUARD`. Use `@Public()` only for `POST /auth/login`, `POST /auth/refresh`, and `POST /auth/setup-password`. This inverts the default.

### Pitfall 6: Audit Write Inside the Mutation Transaction
**What goes wrong:** If the user update fails and the transaction rolls back, the audit record is also rolled back. Now there is no record that the mutation was attempted.

**How to avoid:** Write to `audit_logs` in a separate `prisma.auditLog.create()` call outside any transaction wrapping the main mutation. The audit log is append-only by design — a failed attempt is still worth recording.

### Pitfall 7: No Mailpit in Docker Compose
**What goes wrong:** Password setup emails are sent during development. Without a local email capture tool, developers cannot see the setup link without configuring real SMTP credentials.

**How to avoid:** Add Mailpit to `docker-compose.yml`. It captures all outgoing SMTP on port 1025 and provides a web UI at port 8025. Configure nodemailer to use `localhost:1025` in development.

---

## Code Examples

### Prisma Schema (Phase 1 tables)
```prisma
// apps/api/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  EMPLOYEE
  CUSTOMER
}

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  name              String
  role              UserRole  @default(EMPLOYEE)
  passwordHash      String?   // null until setup link used
  setupToken        String?   // argon2 hash of raw email token
  setupTokenExpiry  DateTime?
  isActive          Boolean   @default(true)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  createdById       String?   // admin who created this account

  auditLogs         AuditLog[]
}

// APPEND-ONLY — DB user lacks UPDATE/DELETE on this table
model AuditLog {
  id          String   @id @default(cuid())
  actorId     String?  // null for system-generated events
  actor       User?    @relation(fields: [actorId], references: [id])
  action      String   // e.g. "user.created", "user.passwordReset"
  entityType  String   // e.g. "User", "Rental"
  entityId    String   // ID of the mutated record
  changesJson Json     // { field: { old: X, new: Y } }
  ipAddress   String?
  createdAt   DateTime @default(now())

  @@index([entityType, entityId])
  @@index([actorId])
  @@index([createdAt])
}
```

### Docker Compose (dev environment)
```yaml
# docker-compose.yml (root)
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: rentapp
      POSTGRES_USER: rentapp
      POSTGRES_PASSWORD: rentapp_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U rentapp']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    ports:
      - '9000:9000'
      - '9001:9001'
    environment:
      MINIO_ROOT_USER: rentapp
      MINIO_ROOT_PASSWORD: rentapp_dev
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

  mailpit:
    image: axllent/mailpit:latest
    ports:
      - '1025:1025'   # SMTP
      - '8025:8025'   # Web UI

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### Turborepo Configuration
```json
// turbo.json (root)
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    },
    "db:migrate": {
      "cache": false
    },
    "db:generate": {
      "cache": false,
      "outputs": ["node_modules/.prisma/**"]
    }
  }
}
```

```yaml
# pnpm-workspace.yaml (root)
packages:
  - 'apps/*'
  - 'packages/*'
```

### Environment Variables Template
```bash
# apps/api/.env.example
DATABASE_URL="postgresql://rentapp:rentapp_dev@localhost:5432/rentapp"
REDIS_URL="redis://localhost:6379"

# JWT — generate with: openssl rand -hex 32
JWT_ACCESS_SECRET="change-me-32-bytes-hex"
JWT_REFRESH_SECRET="change-me-different-32-bytes-hex"

# Field-level encryption for PII (PESEL, ID numbers)
# generate with: openssl rand -hex 32
FIELD_ENCRYPTION_KEY="change-me-32-bytes-hex"
FIELD_HMAC_KEY="change-me-different-32-bytes-hex"

# Email (nodemailer)
# Dev: use mailpit (localhost:1025, no auth)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@rentapp.pl"

APP_URL="http://localhost:3000"   # used in email setup links
API_PORT="3001"

# MinIO (dev)
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="rentapp"
MINIO_SECRET_KEY="rentapp_dev"
MINIO_BUCKET="rentapp"
```

### Field Encryption Utility (scaffold for Phase 2 PII)
```typescript
// common/crypto/field-encryption.ts
import { createCipheriv, createDecipheriv, randomBytes, createHmac } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.FIELD_ENCRYPTION_KEY!, 'hex');
const HMAC_KEY = process.env.FIELD_HMAC_KEY!;

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: iv:authTag:ciphertext (all hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(stored: string): string {
  const [ivHex, authTagHex, ciphertextHex] = stored.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext) + decipher.final('utf8');
}

// Blind index for searching encrypted fields (e.g. search by PESEL)
// Store this hash alongside the encrypted value; compare hashes to search
export function hmacIndex(value: string): string {
  return createHmac('sha256', HMAC_KEY).update(value.toLowerCase()).digest('hex');
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prisma with Rust binary engine | Prisma 7+ pure TypeScript | Prisma 7.0 (late 2024) | 85-90% smaller bundle; faster cold starts on Railway |
| bcrypt | argon2id | OWASP recommendation update 2023 | Memory-hard; GPU-resistant; bcrypt still acceptable but argon2id preferred for new systems |
| 24h session JWT | Short access JWT + refresh token | Industry standard by 2022 | Enables logout, lockout, and token rotation without sacrificing UX |
| TypeORM + NestJS | Prisma + NestJS | 2022-2024 ecosystem shift | Prisma schema-first with auto-generated types; better DX; Prisma 7 closed performance gap |
| NestJS 10 | NestJS 11.x | Released 2024-2025 | Node.js 22 LTS support; Express 5 default; performance improvements |
| Manual role middleware | `@Roles()` + `RolesGuard` | NestJS v7+ | Declarative, testable, centralized authorization |

**Deprecated/outdated:**
- `@nestjs/typeorm` + TypeORM: Still functional but Prisma is the current ecosystem standard. STACK.md locks in Prisma 7.
- Cookie-based sessions for mobile: JWT in Authorization header is standard for React Native. Cookies require complex handling in RN.
- pnpm v8: Current is v10.x (10.32.1 on npm). Use v10 LTS throughout.

---

## Open Questions

1. **argon2 native compilation on Railway**
   - What we know: argon2 npm package compiles native bindings; Railway uses Nix-based build environment
   - What's unclear: Whether native compilation succeeds without extra Railway build configuration
   - Recommendation: Test early in Phase 1. If it fails, fall back to `bcrypt@6.0.0` (pure JS fallback available via `bcryptjs`). Railway generally supports native modules but this should be verified in the first deployment.

2. **Audit log DB user immutability enforcement**
   - What we know: Audit table must be append-only; application code must not UPDATE or DELETE audit records
   - What's unclear: Whether to create a separate restricted DB user or rely on application discipline
   - Recommendation: Create two DB users in the Docker Compose init script and Railway environment: `rentapp_app` (INSERT only on audit_logs, full access to other tables) and `rentapp_admin` (full access for migrations). This enforces immutability at the database layer.

3. **Monorepo structure variation from project research**
   - What we know: CONTEXT.md specifies `apps/api`, `apps/web`, `apps/mobile`, `packages/shared`. ARCHITECTURE.md shows `server/` instead of `apps/api` and `apps/admin` instead of `apps/web`.
   - What's unclear: Which naming to use — CONTEXT.md decisions are locked
   - Recommendation: CONTEXT.md is authoritative. Use `apps/api`, `apps/web`, `apps/mobile`, `packages/shared`. The ARCHITECTURE.md structure is illustrative, not prescriptive.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (included in NestJS default scaffold) + supertest for e2e |
| Config file | `apps/api/jest.config.ts` — Wave 0 creation needed |
| Quick run command | `pnpm --filter api test -- --testPathPattern="(auth\|audit\|roles)"` |
| Full suite command | `pnpm --filter api test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | POST /auth/login with valid credentials returns tokens | Integration | `pnpm --filter api test:e2e -- auth` | Wave 0 |
| AUTH-01 | POST /auth/login with wrong password returns 401 | Integration | `pnpm --filter api test:e2e -- auth` | Wave 0 |
| AUTH-01 | POST /auth/login locks after 5 failures | Integration | `pnpm --filter api test:e2e -- auth` | Wave 0 |
| AUTH-02 | POST /users (admin) creates user + queues email | Unit | `pnpm --filter api test -- users.service` | Wave 0 |
| AUTH-02 | POST /auth/setup-password with valid token sets passwordHash | Integration | `pnpm --filter api test:e2e -- auth` | Wave 0 |
| AUTH-02 | POST /auth/setup-password with expired token returns 400 | Integration | `pnpm --filter api test:e2e -- auth` | Wave 0 |
| AUTH-03 | POST /auth/refresh with valid token returns new pair | Integration | `pnpm --filter api test:e2e -- auth` | Wave 0 |
| AUTH-03 | POST /auth/refresh rotates token (old token rejected) | Integration | `pnpm --filter api test:e2e -- auth` | Wave 0 |
| AUTH-04 | Admin-only endpoint returns 403 with EMPLOYEE role JWT | Integration | `pnpm --filter api test:e2e -- auth` | Wave 0 |
| AUTH-04 | RolesGuard passes ADMIN on admin-only route | Unit | `pnpm --filter api test -- roles.guard` | Wave 0 |
| AUTH-05 | AuditLog row created after POST /users | Integration | `pnpm --filter api test:e2e -- audit` | Wave 0 |
| AUTH-05 | AuditService.log() writes correct changesJson diff | Unit | `pnpm --filter api test -- audit.service` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter api test -- --testPathPattern="(auth|audit|roles)"`
- **Per wave merge:** `pnpm --filter api test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/jest.config.ts` — Jest config with ts-jest transformer
- [ ] `apps/api/test/jest-e2e.json` — e2e test config pointing to `test/**/*.e2e-spec.ts`
- [ ] `apps/api/test/auth.e2e-spec.ts` — covers AUTH-01, AUTH-02, AUTH-03, AUTH-04
- [ ] `apps/api/test/audit.e2e-spec.ts` — covers AUTH-05 integration
- [ ] `apps/api/src/audit/audit.service.spec.ts` — covers AUTH-05 unit
- [ ] `apps/api/src/common/guards/roles.guard.spec.ts` — covers AUTH-04 unit
- [ ] `apps/api/src/users/users.service.spec.ts` — covers AUTH-02 unit
- [ ] Framework install: Jest is included in NestJS default scaffold — no additional install

---

## Sources

### Primary (HIGH confidence)
- npm registry (versions verified March 2026): @nestjs/core@11.1.17, @nestjs/jwt@11.0.2, @nestjs/passport@11.0.5, @nestjs/config@4.0.3, @nestjs/throttler@6.5.0, @nestjs/bull@11.0.4, prisma@7.5.0, argon2@0.44.0, bullmq@5.71.0, ioredis@5.10.1, turbo@2.8.20, nodemailer@8.0.3, uuid@13.0.0, helmet@8.1.0, class-validator@0.15.1
- UODO fine against ING Bank 18M PLN (document scanning): https://uodo.gov.pl/decyzje/DKN.5131.1.2025
- UODO fine against Glovo 5.9M PLN: https://kicb.pl/ponad-58-mln-zl-kary-dla-wlasciciela-glovo-za-skanowanie-dokumentow/
- OWASP Password Storage Cheat Sheet (argon2id recommendation): https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- Prisma v7 announcement (TypeScript engine): https://www.prisma.io/blog/announcing-prisma-orm-7-0-0
- NestJS official docs (guards, interceptors, passport): https://docs.nestjs.com
- Project STACK.md, ARCHITECTURE.md, PITFALLS.md (HIGH confidence per prior research phase)

### Secondary (MEDIUM confidence)
- Railway native module support — documented in Railway build system docs but argon2 compilation needs runtime validation
- Mailpit as local email capture tool — well-known in NestJS development workflows; not verified against Railway's specific setup

### Tertiary (LOW confidence)
- None — all critical claims are verified against primary sources

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry, March 2026
- Auth strategy (access+refresh, Redis lockout): HIGH — industry standard patterns with direct NestJS documentation support
- Prisma schema: HIGH — modeled from ARCHITECTURE.md (HIGH confidence prior research)
- Field encryption utility: HIGH — uses Node.js built-in `crypto`; AES-256-GCM is the standard choice
- RODO/PII pitfalls: HIGH — backed by UODO enforcement decisions with documented fine amounts
- Test framework: HIGH — NestJS scaffolds Jest by default; commands are standard pnpm workspace patterns

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable libraries; RODO enforcement context is ongoing)
