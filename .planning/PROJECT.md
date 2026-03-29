# RentApp — System Zarządzania Wypożyczalnią Samochodów

## What This Is

Production-ready system do zarządzania wypożyczalnią samochodów: aplikacja mobilna cross-platform (Expo/React Native) dla pracowników, panel webowy (Next.js) dla administratora, portal klienta, API backend (NestJS/Prisma). Pełny cykl wynajmu z podpisem cyfrowym, dokumentacją fotograficzną, weryfikacją CEPiK, powiadomieniami SMS/email. Gotowe do wdrożenia na Railway z CI/CD via GitHub Actions.

## Core Value

Pracownik w terenie może w pełni obsłużyć wynajem — od wypełnienia umowy, przez zweryfikowanie uprawnień kierowcy, zrobienie zdjęć auta, po podpis klienta i wysyłkę PDF — bez papieru i bez powrotu do biura.

## Requirements

### Validated

- ✓ Interaktywna umowa cyfrowa z podpisem (rysik/palec) — v1.0
- ✓ Generowanie PDF z gotowego wzoru umowy i wysyłka mailem — v1.0
- ✓ Weryfikacja uprawnień kierowcy (CEPiK 2.0 API) — v1.0
- ✓ Dokumentacja fotograficzna pojazdu (przed wynajmem, przy zwrocie, oznaczanie szkód) — v1.0
- ✓ Panel admina z bazą danych i wyszukiwaniem — v1.0
- ✓ Kalendarz wynajmów z alertami (mail + in-app) — v1.0
- ✓ Integracja SMS (smsapi.pl) — v1.0
- ✓ Przedłużanie najmu przez admina z automatycznym SMS — v1.0
- ✓ Prosty panel klienta (podgląd umów, terminów, historii) — v1.0
- ✓ Auth z audit trailem — v1.0
- ✓ Aplikacja cross-platform dla pracowników (Android + iOS) — v1.0
- ✓ Panel webowy admina (desktop) — v1.0
- ✓ Security hardening (portal JWT separation, env protection, input limits, rate limiting, CSV sanitization) — v2.1
- ✓ Critical bug fixes (idempotent rental creation, contract number atomicity, hydration guards, retention safety) — v2.1
- ✓ API validation & pagination (server-side pagination, UUID validation, N+1 fixes, structured logging) — v2.1
- ✓ Mobile quality & UX (state persistence, safe area, accessibility, validation, diacritics) — v2.1
- ✓ Web quality & accessibility (error handling, form validation, ARIA, responsive, shared components) — v2.1
- ✓ Infrastructure & CI/CD (Redis in CI, Puppeteer Docker, migrations, health checks, coverage) — v2.1
- ✓ Code quality (TypeScript any removal, shared types, dead code cleanup, DB indexes) — v2.1

### Active

- [ ] Working Android APK build via EAS Build preview profile
- [ ] Correct app.config.ts configuration for Android builds
- [ ] Valid eas.json preview profile for APK output
- [ ] All required assets (icon, splash, adaptive-icon) present
- [ ] Successful `eas build --platform android --profile preview` execution

## Current Milestone: v2.2 Android APK Build Fix

**Goal:** Fix failing Android APK build so the app can be installed on 9 Android devices.

**Target features:**
- Diagnose and fix Gradle build failure
- Ensure correct EAS Build configuration
- Generate missing assets if needed
- Verify working APK build end-to-end

### Out of Scope

- Płatności online — wypożyczalnia rozlicza się z klientem bezpośrednio
- Rezerwacja online przez klienta — na ten moment wynajem odbywa się na miejscu
- Wielojęzyczność — interfejs tylko po polsku (v1)
- Integracja z systemami księgowymi — na razie ręczne rozliczenia

## Context

- **Branża:** Wypożyczalnia samochodów, rynek polski
- **Skala:** ~100 samochodów we flocie (±20%), ~10 pracowników (±50%)
- **Tech stack:** Expo/React Native (mobile), Next.js (web), NestJS/Prisma (API), PostgreSQL, Redis, S3-compatible storage
- **Hosting:** Railway (API+Web), Cloudflare R2 (storage), Neon DB, Upstash Redis
- **CI/CD:** GitHub Actions with Redis service, mobile typecheck, E2E tests, coverage enforcement
- **Shipped:** v1.0 MVP, v1.1 Quality & Polish, v2.0 Production Ready, v2.1 Fix All Audit Issues
- **In progress:** v2.2 Android APK Build Fix

## Constraints

- **Tech stack mobilny:** Expo/React Native (SDK 54)
- **Język UI:** Polski
- **SMS provider:** smsapi.pl (wymaganie biznesowe)
- **Wzór umowy:** Musi odwzorować istniejący szablon PDF
- **CEPiK:** Zależność od zewnętrznego API
- **Hosting:** Railway, Cloudflare R2, Neon DB, Upstash Redis

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React Native/Expo zamiast Flutter | Wspólny ekosystem JS z backendem, jeden język w monorepo | ✓ Good |
| NestJS + Prisma na backend | TypeScript end-to-end, silne typowanie, DI framework | ✓ Good |
| Monorepo z Turborepo + pnpm | Shared types, jednolite tooling, atomic commits | ✓ Good |
| Railway + Cloudflare R2 | Brak VPS, zarządzane platformy, auto-scaling | ✓ Good |
| Separate portal JWT secret | Izolacja bezpieczeństwa — kompromitacja jednego nie wpływa na drugi | ✓ Good (v2.1) |
| Server-side pagination | Skalowanie przy rosnącej liczbie wynajmów/klientów | ✓ Good (v2.1) |
| Shared types w monorepo | Jedna definicja RentalWithRelations, PaginatedResponse — brak duplikacji | ✓ Good (v2.1) |

---
*Last updated: 2026-03-29 after v2.2 milestone start*
