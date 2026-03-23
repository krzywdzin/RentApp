# Requirements: RentApp

**Defined:** 2026-03-23
**Core Value:** Pracownik w terenie może w pełni obsłużyć wynajem — od wypełnienia umowy, przez zweryfikowanie uprawnień kierowcy, zrobienie zdjęć auta, po podpis klienta i wysyłkę PDF — bez papieru i bez powrotu do biura.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Uwierzytelnianie i Role (Authentication & Roles)

- [x] **AUTH-01**: Pracownik/admin może zalogować się emailem i hasłem
- [x] **AUTH-02**: Pracownik może zresetować hasło przez link email
- [x] **AUTH-03**: Sesja użytkownika utrzymuje się po odświeżeniu przeglądarki/aplikacji
- [x] **AUTH-04**: System rozróżnia role: admin (pełny dostęp), pracownik (aplikacja mobilna + ograniczony web), klient (portal read-only)
- [x] **AUTH-05**: Każda mutacja w systemie jest logowana w audit trailu (kto, co, kiedy) — log niezmienny

### Flota (Fleet Management)

- [ ] **FLEET-01**: Admin może dodawać/edytować/usuwać pojazdy (rejestracja, VIN, marka/model, przebieg, ubezpieczenie, przegląd)
- [ ] **FLEET-02**: Status pojazdu aktualizuje się automatycznie na podstawie cyklu wynajmu (dostępny, wynajęty, serwis)
- [ ] **FLEET-03**: Admin może zaimportować flotę z pliku CSV/XLS

### Klienci (Customer Management)

- [ ] **CUST-01**: Pracownik może dodać nowego klienta (imię, nazwisko, telefon, adres, email, dowód osobisty, PESEL, prawo jazdy)
- [ ] **CUST-02**: Dane wrażliwe (PESEL, nr dowodu, nr prawa jazdy) są szyfrowane na poziomie pola (AES-256-GCM)
- [ ] **CUST-03**: Pracownik może wyszukać klienta po nazwisku, telefonie lub PESEL-u — dane auto-uzupełniają się dla powracających klientów
- [ ] **CUST-04**: System implementuje polityki retencji danych zgodne z RODO (automatyczne usuwanie po okresie retencji)

### Cykl Wynajmu (Rental Lifecycle)

- [ ] **RENT-01**: Pracownik może utworzyć wynajem (pojazd + klient + daty od-do z godziną)
- [ ] **RENT-02**: Kalendarz wynajmów z interaktywnym widokiem timeline i zapobieganiem podwójnym rezerwacjom (PostgreSQL exclusion constraints)
- [ ] **RENT-03**: Wynajem przechodzi przez stany: szkic → aktywny → przedłużony → zwrócony → zamknięty (state machine)
- [ ] **RENT-04**: Pracownik może przeprowadzić strukturalny zwrot: rejestracja przebiegu, lista kontrolna uszkodzeń, porównanie ze stanem przy wydaniu
- [ ] **RENT-05**: Admin może przedłużyć wynajem — automatyczna aktualizacja dat, przeliczenie kosztu, powiadomienie SMS do klienta

### Umowa i PDF (Contract & PDF)

- [ ] **CONT-01**: Pracownik może wypełnić cyfrową umowę najmu z danymi klienta, pojazdu i warunków
- [ ] **CONT-02**: Klient podpisuje umowę cyfrowo (rysik/palec) z metadanymi audytowymi (timestamp, urządzenie, hash treści, ID pracownika-świadka)
- [ ] **CONT-03**: System generuje PDF z podpisanej umowy wg istniejącego szablonu (Handlebars + Puppeteer), z pełną obsługą polskich znaków
- [ ] **CONT-04**: PDF jest automatycznie wysyłany emailem do klienta po podpisaniu
- [ ] **CONT-05**: System przechowuje wersje umów — aneksy przy przedłużeniach

### Dokumentacja Fotograficzna (Photo Documentation)

- [ ] **PHOTO-01**: Pracownik może wykonać strukturalny obchód fotograficzny pojazdu przy wydaniu i zwrocie
- [ ] **PHOTO-02**: Każde zdjęcie zawiera timestamp i metadane GPS
- [ ] **PHOTO-03**: Zdjęcia są powiązane z konkretnym wynajmem i można porównać stan przy wydaniu vs zwrocie (side-by-side)

### Powiadomienia (Notifications)

- [ ] **NOTIF-01**: System wysyła SMS przez smsapi.pl: potwierdzenie wynajmu, przypomnienie o zwrocie (1 dzień przed), alert o przekroczeniu terminu
- [ ] **NOTIF-02**: System wysyła email z umową PDF i potwierdzeniami wynajmu
- [ ] **NOTIF-03**: Przy przedłużeniu wynajmu system automatycznie wysyła SMS do klienta z nowym terminem

### Panel Admina (Admin Panel)

- [ ] **ADMIN-01**: Admin ma pełny CRUD na wszystkich encjach (pojazdy, klienci, wynajmy, umowy) przez panel webowy (desktop-first)
- [ ] **ADMIN-02**: Admin może wyszukiwać i filtrować dane (po rejestracji, nazwisku, zakresie dat) z możliwością bulk operacji
- [ ] **ADMIN-03**: Admin może przeglądać audit trail per wynajem, pojazd lub pracownik

### Aplikacja Mobilna (Mobile App)

- [ ] **MOB-01**: Pracownik ma aplikację mobilną cross-platform (Android + iOS) z logowaniem i dostępem do swoich funkcji
- [ ] **MOB-02**: Pracownik może w aplikacji: wyszukać/dodać klienta, wybrać pojazd, wypełnić umowę, pobrać podpis, zrobić zdjęcia, złożyć wynajem
- [ ] **MOB-03**: Pracownik może przeprowadzić zwrot pojazdu w aplikacji mobilnej

### CEPiK (Driver Verification)

- [ ] **CEPIK-01**: System weryfikuje uprawnienia kierowcy przez CEPiK 2.0 API (status zawieszenia, ważność prawa jazdy) przed podpisaniem umowy
- [ ] **CEPIK-02**: Weryfikacja CEPiK jest asynchroniczna z ręcznym fallbackiem — wynajem może być realizowany bez niej

### Portal Klienta (Customer Portal)

- [ ] **PORTAL-01**: Klient może zalogować się do prostego portalu web przez magic link (link w emailu z umową)
- [ ] **PORTAL-02**: Klient widzi swoje aktywne wynajmy, historię, terminy zwrotu i może pobrać PDF umowy

### Oznaczanie Uszkodzeń (Damage Marking)

- [ ] **DMG-01**: Pracownik może oznaczyć uszkodzenia na interaktywnym diagramie SVG pojazdu (tap → pin → zdjęcie)
- [ ] **DMG-02**: System pozwala porównać diagramy uszkodzeń: stan przy wydaniu vs stan przy zwrocie (side-by-side)

### System Alertów (Alert System)

- [ ] **ALERT-01**: System automatycznie generuje alerty: zbliżający się termin zwrotu, przeterminowany zwrot, wygasające ubezpieczenie, zbliżający się przegląd
- [ ] **ALERT-02**: Alerty wysyłane wielokanałowo (email + SMS + in-app) z konfigurowalnymi regułami (warunek + kanał + timing)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Offline & Performance

- **OFFL-01**: Aplikacja mobilna działa offline — kolejkuje mutacje lokalnie, synchronizuje po przywróceniu połączenia
- **OFFL-02**: Zdjęcia uploadują się w tle po przywróceniu połączenia

### Analityka i Raporty

- **REPT-01**: Dashboard z raportami: wykorzystanie floty %, przychód per pojazd, trendy sezonowe
- **REPT-02**: Eksport raportów do PDF/XLS

### Serwis Pojazdów

- **SERV-01**: Log serwisowy per pojazd (przeglądy, naprawy, koszty)
- **SERV-02**: Dashboard rentowności per pojazd (koszty vs przychody)

### Automatyzacja

- **AUTO-01**: OCR skan dowodu osobistego i prawa jazdy — auto-fill pól formularza

## Out of Scope

| Feature | Reason |
|---------|--------|
| Płatności online | Wypożyczalnia rozlicza się bezpośrednio (gotówka/przelew) — PCI compliance niepotrzebne |
| Rezerwacja online przez klienta | Wynajmy odbywają się na miejscu — booking engine to ogromny scope bez zapotrzebowania |
| Wielojęzyczność | Polski rynek, v1 — kod strukturalnie gotowy na i18n, ale bez implementacji |
| Integracja z księgowością | Brak istniejącego systemu — eksport CSV/XLS wystarczy |
| Śledzenie GPS pojazdów | Wymaga hardware w każdym aucie — nadmiarowy koszt dla lokalnej floty |
| Dynamiczny pricing | Firma używa stałych cenników — algorytmiczne ceny dodają nieprzewidywalność |
| AI wykrywanie uszkodzeń | Technologia niedojrzała, kosztowna, false positives na małej skali |
| Chat / moduł wiadomości | 10 pracowników, bezpośrednie relacje z klientami — SMS + telefon wystarczą |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| FLEET-01 | Phase 2 | Pending |
| FLEET-02 | Phase 2 | Pending |
| FLEET-03 | Phase 2 | Pending |
| CUST-01 | Phase 2 | Pending |
| CUST-02 | Phase 2 | Pending |
| CUST-03 | Phase 2 | Pending |
| CUST-04 | Phase 2 | Pending |
| RENT-01 | Phase 3 | Pending |
| RENT-02 | Phase 3 | Pending |
| RENT-03 | Phase 3 | Pending |
| RENT-04 | Phase 3 | Pending |
| RENT-05 | Phase 3 | Pending |
| CONT-01 | Phase 4 | Pending |
| CONT-02 | Phase 4 | Pending |
| CONT-03 | Phase 4 | Pending |
| CONT-04 | Phase 4 | Pending |
| CONT-05 | Phase 4 | Pending |
| ADMIN-01 | Phase 5 | Pending |
| ADMIN-02 | Phase 5 | Pending |
| ADMIN-03 | Phase 5 | Pending |
| MOB-01 | Phase 6 | Pending |
| MOB-02 | Phase 6 | Pending |
| MOB-03 | Phase 6 | Pending |
| PHOTO-01 | Phase 7 | Pending |
| PHOTO-02 | Phase 7 | Pending |
| PHOTO-03 | Phase 7 | Pending |
| DMG-01 | Phase 7 | Pending |
| DMG-02 | Phase 7 | Pending |
| NOTIF-01 | Phase 8 | Pending |
| NOTIF-02 | Phase 8 | Pending |
| NOTIF-03 | Phase 8 | Pending |
| ALERT-01 | Phase 8 | Pending |
| ALERT-02 | Phase 8 | Pending |
| CEPIK-01 | Phase 9 | Pending |
| CEPIK-02 | Phase 9 | Pending |
| PORTAL-01 | Phase 9 | Pending |
| PORTAL-02 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 42 total
- Mapped to phases: 42
- Unmapped: 0

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 after roadmap creation*
