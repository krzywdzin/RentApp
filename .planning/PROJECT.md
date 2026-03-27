# RentApp — System Zarządzania Wypożyczalnią Samochodów

## What This Is

System do zarządzania wypożyczalnią samochodów składający się z aplikacji mobilnej cross-platform dla pracowników (Android + iOS), panelu webowego dla administratora, oraz prostego panelu klienta. Obsługuje pełny cykl wynajmu — od interaktywnej umowy z podpisem cyfrowym, przez dokumentację fotograficzną pojazdu, po przypomnienia SMS o zwrocie. Flota ~100 samochodów, ~10 pracowników.

## Core Value

Pracownik w terenie może w pełni obsłużyć wynajem — od wypełnienia umowy, przez zweryfikowanie uprawnień kierowcy, zrobienie zdjęć auta, po podpis klienta i wysyłkę PDF — bez papieru i bez powrotu do biura.

## Current Milestone: v2.1 Fix All Audit Issues

**Goal:** Naprawić wszystkie pozostałe problemy jakościowe znalezione w audycie kodu — bezpieczeństwo, bugi, brakująca walidacja, obsługa błędów, dostępność, wydajność, infrastruktura CI/CD, i jakość kodu we wszystkich komponentach (mobile, API, web, infra).

**Target features:**
- Security: osobny JWT secret dla portalu, gitignore dla .env, walidacja rozmiaru base64, SMTP auth, encryption key placeholder
- API: race condition w numeracji umów, paginacja, walidacja DTO, logging, N+1 queries, retention guard, transaction handling
- Mobile: 7 krytycznych bugów (duplikaty rental, hydration guard, SearchBar sync), state management, nawigacja, walidacja, safe area
- Web: error handling na wszystkich stronach, form validation, error boundaries, paginacja, state management, responsive design
- Accessibility: keyboard navigation, aria labels, screen reader support w mobile i web
- Infra: Redis w CI, Puppeteer w Docker, prisma migrate w deploy, mobile w CI, coverage enforcement
- Code Quality: dead code removal, type safety, shared types, consistent patterns

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

### Active

- [ ] Security: separate portal JWT secret, gitignore .env files, base64 size limits, SMTP auth, encryption key safety
- [ ] API: contract number race condition, server-side pagination, DTO validation gaps, structured logging, N+1 query fixes
- [ ] Mobile: critical bugs (duplicate rental, hydration guard, SearchBar sync), state persistence, safe area, validation
- [ ] Web: error handling on all pages, form validation, error boundaries, responsive design, state management fixes
- [ ] Accessibility: keyboard navigation, aria labels, screen reader support across mobile and web
- [ ] Infra: Redis in CI, Puppeteer in Docker, prisma migrate in deploy, mobile CI, coverage enforcement
- [ ] Code Quality: dead code removal, type safety improvements, shared type exports, pattern consistency

### Out of Scope

- Płatności online — wypożyczalnia rozlicza się z klientem bezpośrednio
- Rezerwacja online przez klienta — na ten moment wynajem odbywa się na miejscu
- Wielojęzyczność — interfejs tylko po polsku (v1)
- Integracja z systemami księgowymi — na razie ręczne rozliczenia

## Context

- **Branża:** Wypożyczalnia samochodów, rynek polski
- **Skala:** ~100 samochodów we flocie (±20%), ~10 pracowników (±50%)
- **Wzór umowy:** Istnieje gotowy szablon umowy — do odwzorowania w generatorze PDF
- **CEPiK 2.0:** API publiczne do weryfikacji uprawnień kierowców — wymaga zbadania warunków dostępu, kosztów i sposobu integracji
- **SMS:** Integracja przez smsapi.pl (polski dostawca, gotowe API)
- **Pracownik iOS:** Jeden pracownik korzysta z iOS — stąd decyzja o cross-platform zamiast natywnego Androida
- **Hosting:** Brak istniejącej infrastruktury — do dobrania podczas researchu

### Dane zbierane od klienta w umowie

- Imię (imiona), Nazwisko
- Nr telefonu, Adres, Adres email
- Nr dowodu osobistego, Organ wydający + data wydania
- PESEL
- Prawo jazdy: kategoria, nr prawa jazdy, nr druku, organ wydający
- Podpis cyfrowy (rysik/palec)

### Dane wypełniane przez pracownika

- Data najmu (od–do, data + godzina)
- Pojazd (jaki samochód)
- Nr rejestracyjny

## Constraints

- **Tech stack mobilny:** Cross-platform (React Native lub Flutter — do ustalenia po researchu)
- **Język UI:** Polski
- **SMS provider:** smsapi.pl (wymaganie biznesowe)
- **Wzór umowy:** Musi odwzorować istniejący szablon PDF
- **CEPiK:** Zależność od zewnętrznego API — może wymagać alternatywnego podejścia jeśli dostęp ograniczony
- **Hosting:** Zewnętrzne platformy (Railway dla API+Web, Cloudflare R2 dla storage, Neon DB, Upstash Redis) — użytkownik ma tylko FTP, nie VPS

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Cross-platform zamiast natywnego Androida | Jeden pracownik na iOS — jedna baza kodu dla obu platform | — Pending (tech do ustalenia po researchu) |
| Prosty panel klienta | Klient widzi swoje umowy i terminy, dostęp w mailu z umową | — Pending |
| Auth z audit trailem | Potrzeba identyfikacji który pracownik wykonał daną akcję | — Pending |
| CEPiK 2.0 API | Weryfikacja uprawnień kierowcy — wymaga zbadania dostępności i kosztów | — Pending |
| smsapi.pl jako provider SMS | Wymaganie biznesowe — polski dostawca, sprawdzone API | — Pending |

---
*Last updated: 2026-03-27 after v2.1 milestone start*
