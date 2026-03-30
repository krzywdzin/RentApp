# RentApp - Checklist wdrozenia u klienta (KITEK)

## Architektura

| Komponent | Technologia | Deploy na | Port |
|-----------|------------|-----------|------|
| API | NestJS + Prisma | Railway | 3000 |
| Web (admin) | Next.js 15 | Railway | 3001 |
| Mobile | Expo 54 / React Native | EAS Build | - |
| Baza danych | PostgreSQL 16 | Neon | 5432 |
| Cache | Redis 7 | Upstash | 6379 |
| Storage (S3) | S3-compatible | Cloudflare R2 | - |
| PDF | Puppeteer + Chromium | W kontenerze API | - |
| SMS | SMSAPI (smsapi.pl) | Zewnetrzny | - |
| Email | Nodemailer (SMTP) | Zewnetrzny | - |

## Domeny do skonfigurowania

| Domena | Cel | Gdzie |
|--------|-----|-------|
| `api.kitek.pl` | API backend | Railway (service: api) |
| `app.kitek.pl` | Panel administracyjny | Railway (service: web) |
| `staging-api.kitek.pl` | API staging | Railway (staging env) |

---

## Sekrety do wygenerowania/pozyskania

### Krytyczne (bez nich apka nie ruszy)

| Zmienna | Opis | Jak wygenerowac |
|---------|------|-----------------|
| `DATABASE_URL` | Connection string Neon | Panel Neon → Connection Details (`?sslmode=require`) |
| `REDIS_URL` | Connection string Upstash | Panel Upstash → REST URL (`rediss://...` z TLS) |
| `JWT_ACCESS_SECRET` | Klucz JWT tokenow | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | Klucz refresh tokenow | `openssl rand -base64 48` |
| `PORTAL_JWT_SECRET` | Oddzielny klucz portalu klienta | `openssl rand -base64 48` |
| `FIELD_ENCRYPTION_KEY` | Szyfrowanie PII (PESEL, dowod) | `openssl rand -hex 32` (64 znaki hex) |

### Uslugi zewnetrzne

| Zmienna | Opis | Gdzie pozyskac |
|---------|------|---------------|
| `SMSAPI_TOKEN` | Token SMSAPI.pl | Panel SMSAPI → Ustawienia → API |
| `SMSAPI_SENDER_NAME` | Nazwa nadawcy SMS | `RentApp` (wymaga aktywacji w SMSAPI) |
| `MAIL_HOST` | Serwer SMTP | Dostawca email (np. smtp.gmail.com) |
| `MAIL_PORT` | Port SMTP | Zazwyczaj 587 (STARTTLS) lub 465 (SSL) |
| `MAIL_USER` | Login SMTP | Od dostawcy email |
| `MAIL_PASS` | Haslo SMTP | Od dostawcy email |
| `MAIL_FROM` | Adres nadawcy | np. `noreply@kitek.pl` |

### Storage (Cloudflare R2)

| Zmienna | Opis | Gdzie |
|---------|------|-------|
| `S3_ENDPOINT` | Endpoint R2 | Panel Cloudflare → R2 → Bucket → S3 API |
| `S3_REGION` | Region | `auto` (konwencja R2) |
| `S3_BUCKET` | Nazwa bucketa | `rentapp` (utworzyc w panelu R2) |
| `S3_ACCESS_KEY` | Klucz dostepu | Cloudflare → R2 → Manage R2 API Tokens |
| `S3_SECRET_KEY` | Sekret | Przy tworzeniu tokena |

### Konfiguracja aplikacji

| Zmienna | Wartosc produkcyjna |
|---------|---------------------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `APP_URL` | `https://api.kitek.pl` |
| `CORS_ORIGINS` | `https://app.kitek.pl` |
| `SMSAPI_TEST_MODE` | `false` |

### Dane firmy (w umowach PDF)

| Zmienna | Wartosc |
|---------|---------|
| `COMPANY_NAME` | `KITEK` |
| `COMPANY_OWNER` | `Pawel Romanowski` |
| `COMPANY_ADDRESS` | `ul. Sieradzka 18, 87-100 Torun` |
| `COMPANY_PHONE` | `535 766 666 / 602 367 100` |

---

## GitHub Secrets & Variables

### Secrets (Settings → Secrets → Actions)

| Nazwa | Opis |
|-------|------|
| `RAILWAY_TOKEN` | Token Railway CLI do deploy |

### Variables (Settings → Variables → Actions)

| Nazwa | Wartosc | Opis |
|-------|---------|------|
| `API_URL` | `https://api.kitek.pl` | Health check po deploy API |
| `WEB_URL` | `https://app.kitek.pl` | Health check po deploy Web |

---

## Kroki wdrozenia

### 1. Infrastruktura

- [ ] Utworzyc projekt w Railway z dwoma serwisami: `api` i `web`
- [ ] Utworzyc baze Neon PostgreSQL (region: eu-central-1)
- [ ] Utworzyc instancje Upstash Redis (region: eu-central-1)
- [ ] Utworzyc bucket Cloudflare R2 (`rentapp`)
- [ ] Skonfigurowac domeny w Railway (api.kitek.pl, app.kitek.pl)
- [ ] Wygenerowac certyfikaty SSL (Railway robi automatycznie)

### 2. Konfiguracja Railway

- [ ] Ustawic wszystkie zmienne srodowiskowe z tabeli powyzej na serwisie `api`
- [ ] Ustawic `API_URL=http://api:3000` na serwisie `web` (internal networking)
- [ ] Railway automatycznie buduje z Dockerfile (skonfigurowane w `railway.toml`)
- [ ] API startCommand: `npx prisma migrate deploy && node dist/main.js`

### 3. Baza danych

- [ ] Migracje uruchomia sie automatycznie przy starcie API (startCommand)
- [ ] Utworzyc pierwszego admina recznie lub przez seed:
  ```sql
  INSERT INTO "User" (id, email, name, "passwordHash", role)
  VALUES (gen_random_uuid(), 'admin@kitek.pl', 'Administrator', '<argon2_hash>', 'ADMIN');
  ```
- [ ] Opcjonalnie: dodac pracownikow przez panel web po zalogowaniu admina

### 4. Mobile (EAS Build)

- [ ] Zainstalowac EAS CLI: `npm install -g eas-cli`
- [ ] Zalogowac sie: `eas login`
- [ ] Skonfigurowac project ID w `app.config.ts` (eas.projectId)
- [ ] Build produkcyjny Android: `eas build --platform android --profile production`
- [ ] Build produkcyjny iOS: `eas build --platform ios --profile production`
- [ ] Submit do sklepow: `eas submit`

### 5. Weryfikacja po deploy

- [ ] `curl https://api.kitek.pl/health` → `{"status":"ok","db":true,"redis":true,"storage":true}`
- [ ] `curl https://app.kitek.pl` → Panel logowania
- [ ] Zalogowac sie do web panelu (admin@kitek.pl)
- [ ] Zalogowac sie na mobile (ten sam login)
- [ ] Utworzyc testowego klienta
- [ ] Utworzyc testowy wynajem
- [ ] Wygenerowac umowe PDF
- [ ] Sprawdzic czy SMS/email dociera

---

## CI/CD Pipeline

Push na `main` automatycznie:
1. Uruchamia testy (lint, typecheck, unit, e2e)
2. Deployuje API na Railway (jesli zmiany w `apps/api/` lub `packages/shared/`)
3. Deployuje Web na Railway (jesli zmiany w `apps/web/` lub `packages/shared/`)
4. Sprawdza health check po deploy (12 prob x 10s = 2 min timeout)

Mobile wymaga recznego `eas build` — nie jest w CI/CD.

---

## Bezpieczenstwo — przed go-live

- [ ] Zrotowac wszystkie sekrety (nie uzywac dev credentials)
- [ ] Upewnic sie ze `.env` NIE jest w git (jest w .gitignore)
- [ ] FIELD_ENCRYPTION_KEY musi byc prawdziwy 64-znakowy hex (nie all-zeros)
- [ ] PORTAL_JWT_SECRET musi byc INNY niz JWT_ACCESS_SECRET
- [ ] SMSAPI_TEST_MODE musi byc `false` w produkcji
- [ ] Sprawdzic rate limiting: 100 req/min global, 10 req/min auth, 5 req/min portal
- [ ] Wlaczyc Sentry monitoring (skonfigurowac org/project w app.config.ts)

---

## Kontakty techniczne

| Usluga | Panel | Kto ma dostep |
|--------|-------|--------------|
| Railway | railway.app | TODO |
| Neon | console.neon.tech | TODO |
| Upstash | console.upstash.com | TODO |
| Cloudflare | dash.cloudflare.com | TODO |
| SMSAPI | panel.smsapi.pl | TODO |
| EAS/Expo | expo.dev | TODO |
| GitHub | github.com | TODO |
