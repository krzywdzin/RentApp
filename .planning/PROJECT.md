# RentApp — System Zarządzania Wypożyczalnią Samochodów

## What This Is

System do zarządzania wypożyczalnią samochodów składający się z aplikacji mobilnej cross-platform dla pracowników (Android + iOS), panelu webowego dla administratora, oraz prostego panelu klienta. Obsługuje pełny cykl wynajmu — od interaktywnej umowy z podpisem cyfrowym, przez dokumentację fotograficzną pojazdu, po przypomnienia SMS o zwrocie. Flota ~100 samochodów, ~10 pracowników.

## Core Value

Pracownik w terenie może w pełni obsłużyć wynajem — od wypełnienia umowy, przez zweryfikowanie uprawnień kierowcy, zrobienie zdjęć auta, po podpis klienta i wysyłkę PDF — bez papieru i bez powrotu do biura.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Interaktywna umowa cyfrowa z podpisem (rysik/palec)
- [ ] Generowanie PDF z gotowego wzoru umowy i wysyłka mailem
- [ ] Weryfikacja uprawnień kierowcy (CEPiK 2.0 API — do zbadania dostępność i koszty)
- [ ] Dokumentacja fotograficzna pojazdu (przed wynajmem, przy zwrocie, oznaczanie szkód)
- [ ] Panel admina z bazą danych i wyszukiwaniem (po rejestracji, nazwisku, etc.)
- [ ] Kalendarz wynajmów z alertami (mail + in-app) o zbliżających się terminach
- [ ] Integracja SMS (smsapi.pl) — przypomnienia o zwrocie, info o przedłużeniu
- [ ] Przedłużanie najmu przez admina z automatycznym SMS do klienta
- [ ] Prosty panel klienta (podgląd umów, terminów, historii) z instrukcją dostępu w mailu
- [ ] Auth z audit trailem — identyfikacja kto (który pracownik) wykonał jaką akcję
- [ ] Aplikacja cross-platform dla pracowników (Android + iOS)
- [ ] Panel webowy admina (desktop)

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
- **Hosting:** Do dobrania — brak istniejącego serwera

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Cross-platform zamiast natywnego Androida | Jeden pracownik na iOS — jedna baza kodu dla obu platform | — Pending (tech do ustalenia po researchu) |
| Prosty panel klienta | Klient widzi swoje umowy i terminy, dostęp w mailu z umową | — Pending |
| Auth z audit trailem | Potrzeba identyfikacji który pracownik wykonał daną akcję | — Pending |
| CEPiK 2.0 API | Weryfikacja uprawnień kierowcy — wymaga zbadania dostępności i kosztów | — Pending |
| smsapi.pl jako provider SMS | Wymaganie biznesowe — polski dostawca, sprawdzone API | — Pending |

---
*Last updated: 2026-03-23 after initialization*
