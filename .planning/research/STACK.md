# Technology Stack

**Project:** RentApp - System Zarzadzania Wypozyczalnia Samochodow
**Researched:** 2026-03-23
**Overall confidence:** HIGH

## Recommended Stack

### Mobile App (Field Employees)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React Native | 0.83 | Cross-platform mobile runtime | Shared JS/TS ecosystem with web admin panel; team likely knows JS better than Dart; one codebase for Android + iOS | HIGH |
| Expo SDK | 55 | Managed RN workflow | Expo SDK 55 is the current stable (March 2026). New Architecture only (legacy dropped). EAS Build/Submit handles native builds without Xcode/Android Studio setup. expo-camera, expo-image-picker built-in | HIGH |
| Expo Router | v7 | File-based navigation | Ships with SDK 55, provides React Navigation under the hood with file-system routing. Deep linking for free | HIGH |
| TypeScript | 5.x | Type safety | Non-negotiable for any modern RN project. Catches contract mismatches between mobile and API early | HIGH |

### Web Admin Panel

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 16 | Full-stack React framework | Current stable is 16.2.x. Server components reduce client bundle. App Router is mature. API routes can proxy to NestJS if needed. SSR not critical (admin panel behind auth) but the framework conventions save time vs bare React | HIGH |
| React | 19.2 | UI library | Ships with Next.js 16 and Expo SDK 55 -- same React version across mobile and web | HIGH |
| Tailwind CSS | v4 | Utility-first styling | v4 is stable and the ecosystem default. CSS-based config (@theme directive), no JS config file needed. Faster builds | HIGH |
| shadcn/ui | latest | Component library | Not a package -- copy-paste components built on Radix + Tailwind. Full control, no version lock-in. Updated for Tailwind v4 and React 19 | HIGH |

### Customer Portal

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js 16 (same app) | 16 | Shared deployment with admin | Customer portal is simple (view contracts, dates, history). Deploy as separate route group within the same Next.js app. Saves infrastructure cost and maintenance. Separate auth context via middleware | HIGH |

### Backend API

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| NestJS | 11.x | Backend framework | Structured, opinionated, TypeScript-native. Modules/controllers/services pattern keeps code organized as features grow. Built-in validation (class-validator), guards for auth, interceptors for audit trail. v12 expected Q3 2026 -- stay on v11 for stability | HIGH |
| Prisma ORM | 7.4 | Database access | v7 dropped the Rust engine -- pure TypeScript now. 85-90% smaller bundle, up to 3.4x faster queries. Schema-first with auto-generated types. Prisma Studio for DB inspection. Migrations are first-class | HIGH |
| PostgreSQL | 16 | Primary database | The only serious choice for a relational business app. JSONB for flexible metadata, full-text search for Polish language (with hunspell), row-level security if needed later | HIGH |

### Infrastructure & Hosting

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Railway | -- | App hosting (API + Web) | Simplest PaaS for small teams. Native PostgreSQL support. Deploy from GitHub push. Usage-based pricing fits ~100-car operation (low traffic). No DevOps required. Starts at ~$5/month | MEDIUM |
| Vercel | -- | Next.js hosting (alternative) | If Railway proves insufficient for Next.js SSR, Vercel is the native host. Free tier generous for admin panels with low traffic | MEDIUM |
| EAS (Expo Application Services) | -- | Mobile builds + OTA updates | Build iOS/Android binaries in the cloud. OTA updates for JS-only changes without App Store review. Free tier covers small team needs | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| react-native-signature-canvas | 4.x | Signature capture | Customer signs rental agreement on tablet/phone. WebView-based, Expo compatible. Exports as PNG/Base64 | HIGH |
| @shopify/react-native-skia | latest | Photo annotation/damage marking | Drawing on vehicle photos to mark damage areas. GPU-accelerated canvas. Works with Expo (with-skia template). Export annotated image via makeImageSnapshot | HIGH |
| expo-camera | SDK 55 | Vehicle photo capture | Built into Expo. Camera access with permissions handled automatically | HIGH |
| expo-image-picker | SDK 55 | Photo selection from gallery | For selecting existing photos. Built into Expo | HIGH |
| Puppeteer | latest | Server-side PDF generation | Render HTML/CSS template to PDF on the server. Handles Polish characters, complex layouts, embedded signature images. Heavier than alternatives but pixel-perfect output matching existing contract template | HIGH |
| Handlebars | 4.x | PDF HTML templating | Inject contract data into HTML template before Puppeteer renders. Simple, logic-less templates. Perfect for rental agreement template | HIGH |
| smsapi (official) | latest | SMS integration | Official smsapi.pl Node.js client. npm package `smsapi`. OAuth token auth. sendSms() method. Required by business | HIGH |
| Nodemailer | 6.x | Email sending | Send PDF contracts to customers, send customer portal access links. Use with any SMTP provider | HIGH |
| Passport.js | 0.7+ | Authentication | NestJS has @nestjs/passport integration. JWT strategy for mobile app, session strategy for web admin. Well-tested | HIGH |
| bull / bullmq | latest | Job queue | Background jobs: PDF generation, SMS sending, email sending, CEPiK verification. Redis-backed. NestJS has @nestjs/bull integration | HIGH |
| Zod | 3.x | Runtime validation | Shared validation schemas between mobile and API. Works with React Hook Form on frontend | HIGH |
| React Hook Form | 7.x | Form management | Complex rental agreement forms on mobile and web. Performant (uncontrolled components). Zod resolver for validation | HIGH |
| date-fns | 3.x | Date utilities | Calendar calculations, rental period math, Polish locale support (pl). Tree-shakeable. Lighter than Moment/Luxon | HIGH |
| FullCalendar or react-big-calendar | latest | Calendar view (admin) | Rental calendar with drag-and-drop. FullCalendar has more features but is heavier. react-big-calendar is lighter and sufficient for this use case | MEDIUM |
| Resend or @nestjs-modules/mailer | latest | Email service | Resend for managed email delivery. Alternative: Nodemailer with SMTP if self-hosting email relay | MEDIUM |
| Redis | 7.x | Caching + job queue backend | Required by BullMQ for job queues. Also useful for session storage and rate limiting CEPiK API calls | HIGH |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Mobile framework | React Native + Expo | Flutter | Dart is a separate language with separate ecosystem. RN shares TypeScript with backend and web admin -- one language for everything. The "one iOS employee" scenario doesn't need Flutter's pixel-perfect rendering |
| Mobile workflow | Expo (managed) | Bare React Native | Expo SDK 55 covers all needed native modules (camera, image picker, file system). No need for bare workflow complexity. EAS handles builds |
| Backend | NestJS | Express / Fastify | Express lacks structure for a multi-module business app. Fastify is fast but unopinionated. NestJS provides the module/controller/service pattern that matches this app's feature set (fleet, contracts, users, SMS, CEPiK) |
| ORM | Prisma 7 | Drizzle ORM | Drizzle is lighter and more SQL-like, but Prisma's schema-first approach with auto-generated types and Prisma Studio is better for a team that needs clear DB modeling. Prisma 7 closed the performance gap |
| PDF generation | Puppeteer + Handlebars | pdfme / react-pdf / pdfmake | The existing rental agreement template needs pixel-perfect reproduction. Puppeteer renders HTML/CSS exactly like a browser -- easiest way to match the existing paper template. pdfmake/react-pdf require learning a custom layout DSL |
| Hosting | Railway | Render / Fly.io / VPS | Render's free PostgreSQL expires after 30 days. Fly.io adds unnecessary complexity (Docker, global distribution not needed for Poland-only). VPS requires DevOps skills. Railway is the sweet spot for simplicity + managed PostgreSQL |
| Admin UI | Next.js + shadcn/ui | React Admin / Refine | React Admin and Refine are opinionated admin frameworks. For RentApp, the admin panel has custom workflows (contract creation, damage annotation, calendar) that don't fit CRUD-only patterns. Next.js + shadcn/ui gives full flexibility |
| Database | PostgreSQL | Supabase (managed) | Supabase adds a layer (PostgREST, auth) that overlaps with NestJS. Since we already have NestJS handling auth and API, Supabase's value-add is just managed hosting. Railway's managed PostgreSQL is simpler and cheaper |
| Signature | react-native-signature-canvas | PSPDFKit / Nutrient | Commercial SDKs (PSPDFKit/Nutrient) cost thousands/year. react-native-signature-canvas is free, Expo-compatible, and exports signatures as images -- which is all we need to embed in the PDF |
| Photo annotation | React Native Skia | Canvas-based libraries | Skia is GPU-accelerated, works cross-platform including web, and is maintained by Shopify. The drawing/annotation UX will be smooth even on mid-range Android devices |

## Monorepo Strategy

Use a **Turborepo** monorepo to share code between mobile and web:

```
rentapp/
  apps/
    mobile/        # Expo (React Native) app
    web/           # Next.js app (admin + customer portal)
  packages/
    shared/        # Shared TypeScript types, Zod schemas, utilities
    api-client/    # Type-safe API client (generated or manual)
  services/
    api/           # NestJS backend
```

**Why Turborepo:** Shared Zod validation schemas, TypeScript types, and utility functions between mobile, web, and API. Parallel builds. Caching. Simpler than Nx for this project size.

## Installation

```bash
# Initialize monorepo
npx create-turbo@latest rentapp

# Mobile (Expo)
cd apps/mobile
npx create-expo-app@latest . --template blank-typescript
npx expo install expo-camera expo-image-picker expo-file-system expo-sharing
npx expo install react-native-webview react-native-signature-canvas
npx expo install @shopify/react-native-skia
npm install react-hook-form @hookform/resolvers zod date-fns

# Web Admin (Next.js)
cd apps/web
npx create-next-app@latest . --typescript --tailwind --app
npx shadcn@latest init
npm install react-hook-form @hookform/resolvers zod date-fns

# Backend (NestJS)
cd services/api
npx @nestjs/cli new . --package-manager npm
npm install @nestjs/passport passport passport-jwt passport-local
npm install @prisma/client prisma
npm install @nestjs/bull bull bullmq ioredis
npm install smsapi nodemailer puppeteer handlebars
npm install class-validator class-transformer
npm install -D @types/passport-jwt @types/nodemailer @types/bull

# Shared packages
cd packages/shared
npm install zod date-fns
```

## Key Version Matrix (March 2026)

| Package | Version | Verified Source |
|---------|---------|----------------|
| Expo SDK | 55 (55.0.8) | expo.dev/changelog/sdk-55 |
| React Native | 0.83.2 | Ships with Expo SDK 55 |
| React | 19.2 | Ships with Expo SDK 55 and Next.js 16 |
| Next.js | 16.2.x | github.com/vercel/next.js/releases |
| NestJS | 11.1.x | github.com/nestjs/nest/releases |
| Prisma | 7.4.x | prisma.io/changelog |
| Tailwind CSS | 4.x | tailwindcss.com |
| TypeScript | 5.x | Ships with all above |
| PostgreSQL | 16 | postgresql.org |
| Redis | 7.x | redis.io |
| Node.js | 22 LTS | nodejs.org (required by Expo SDK 55) |

## CEPiK 2.0 Integration Notes

**Access:** Public API at api.cepik.gov.pl with Swagger docs. Free access to selected data. Full access requires formal application to the Ministry of Digitalization, certificate generation, and approval process.

**Risk:** Access approval may take weeks/months. The API for Carriers (launched January 2025) supports mass automated queries but may have specific requirements for car rental companies.

**Mitigation:** Build the CEPiK integration module with a pluggable adapter. Start with manual driver license verification (employee enters data), add automated CEPiK verification when access is granted. This way the app is usable from day one.

**Technical:** REST API, HTTPS, JSON responses. Standard NestJS HttpModule integration. Rate limiting recommended.

## Sources

- Expo SDK 55 changelog: https://expo.dev/changelog/sdk-55
- Expo SDK reference: https://docs.expo.dev/versions/latest/
- NestJS releases: https://github.com/nestjs/nest/releases
- Prisma v7 announcement: https://www.prisma.io/blog/announcing-prisma-orm-7-0-0
- Prisma v7.4 release: https://www.prisma.io/blog/prisma-orm-v7-4-query-caching-partial-indexes-and-major-performance-improvements
- Next.js releases: https://github.com/vercel/next.js/releases
- react-native-signature-canvas: https://github.com/YanYuanFE/react-native-signature-canvas
- React Native Skia (Expo docs): https://docs.expo.dev/versions/latest/sdk/skia/
- shadcn/ui Tailwind v4: https://ui.shadcn.com/docs/tailwind-v4
- SMSAPI.pl Node.js client: https://github.com/smsapi/smsapi-javascript-client
- CEPiK API documentation: https://api.cepik.gov.pl/doc
- CEPiK access information: https://www.gov.pl/web/cepik/api-dla-centralnej-ewidencji-pojazdow-i-kierowcow-api-do-cepik
- Railway: https://railway.app
- Turborepo: https://turbo.build/repo
