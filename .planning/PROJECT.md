# RentApp — System Zarządzania Wypożyczalnią Samochodów

## What This Is

System do zarządzania wypożyczalnią samochodów składający się z aplikacji mobilnej cross-platform dla pracowników (Android + iOS), panelu webowego dla administratora, oraz prostego panelu klienta. Obsługuje pełny cykl wynajmu — od interaktywnej umowy z podpisem cyfrowym, przez dokumentację fotograficzną pojazdu, po przypomnienia SMS o zwrocie. Flota ~100 samochodów, ~10 pracowników.

## Core Value

Pracownik w terenie może w pełni obsłużyć wynajem — od wypełnienia umowy, przez zweryfikowanie uprawnień kierowcy, zrobienie zdjęć auta, po podpis klienta i wysyłkę PDF — bez papieru i bez powrotu do biura.

## Current Milestone: v2.0 Production Ready

**Goal:** Doprowadzić aplikację do pełnego działania produkcyjnego — naprawić wszystkie bugi z audytu (111 issues), dodać brakujące funkcje (krok zdjęć w wizardzie), naprawić UI/UX (scroll, podpisy, formularze), zabezpieczyć API, i wdrożyć na zewnętrzne platformy (Railway, Cloudflare R2, EAS Build).

**Target features:**
- Mobile: naprawić scroll/keyboard w formularzach, signature pad landscape, dodać krok zdjęć do wizarda, naprawić hardcoded API URL
- API: naprawić rental DRAFT→ACTIVE flow, zabezpieczyć sekrety, dodać env validation, graceful shutdown, error handler, PDF generation error handling
- Web: naprawić type safety, error handling, token refresh, walidacje formularzy
- Infra: deploy API+Web na Railway, storage na Cloudflare R2, build APK przez EAS Build, CI/CD pipeline
- Security: rotacja sekretów, CORS cleanup, rate limiting, input validation

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

- [ ] Mobile UI/UX fixes — scroll, keyboard handling, signature pad landscape
- [ ] Mobile: krok zdjęć pojazdu w wizardzie wynajmu
- [ ] Mobile: dynamiczny API URL z konfiguracji (nie hardcoded)
- [ ] API: rental status transitions (DRAFT→ACTIVE po podpisach)
- [ ] API: env validation, graceful shutdown, global error handler
- [ ] API: security — rotacja sekretów, rate limiting per-endpoint, input size limits
- [ ] API: PDF generation error handling i retry
- [ ] Web: type safety fixes, token refresh, form validations
- [ ] Infra: deploy API+Web na Railway
- [ ] Infra: storage na Cloudflare R2 (zastąpić MinIO)
- [ ] Infra: EAS Build dla APK (Android)
- [ ] Infra: CI/CD pipeline (GitHub Actions)
- [ ] Infra: Dockerfile dla API i Web

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
*Last updated: 2026-03-27 after v2.0 milestone start*
