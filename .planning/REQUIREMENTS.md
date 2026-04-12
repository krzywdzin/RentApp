# Requirements: RentApp v3.0

**Defined:** 2026-04-12
**Core Value:** Pracownik w terenie moze w pelni obsluzyc wynajem -- od wypelnienia umowy, przez zweryfikowanie uprawnien kierowcy, zrobienie zdjec auta, po podpis klienta i wysylke PDF -- bez papieru i bez powrotu do biura.

## v3.0 Requirements

Requirements for v3.0 Client Features & Contract Enhancements. Each maps to roadmap phases.

### Dokumenty klienta (DOC)

- [ ] **DOC-01**: Pracownik moze zrobic zdjecie dowodu osobistego klienta w aplikacji mobilnej
- [ ] **DOC-02**: Pracownik moze zrobic zdjecie prawa jazdy klienta w aplikacji mobilnej
- [ ] **DOC-03**: System automatycznie odczytuje dane z dowodu osobistego (OCR): imie, nazwisko, PESEL, nr dokumentu, adres
- [ ] **DOC-04**: System automatycznie odczytuje dane z prawa jazdy (OCR): nr prawa jazdy, kategorie, data waznosci
- [ ] **DOC-05**: Pracownik moze poprawic/uzupelnic dane po OCR przed zapisem
- [ ] **DOC-06**: Zdjecia dokumentow zapisywane sa w storage (R2) i powiazane z klientem

### Dane klienta (KLIENT)

- [x] **KLIENT-01**: Pracownik moze oznaczyc klienta jako firme (checkbox) i wpisac NIP
- [x] **KLIENT-02**: System waliduje format NIP (10 cyfr, suma kontrolna)
- [x] **KLIENT-03**: Pracownik moze ustawic status platnika VAT klienta: 100%, 50%, nie
- [x] **KLIENT-04**: Pracownik moze wpisac adres klienta w aplikacji mobilnej (ulica, nr, kod, miasto)
- [ ] **KLIENT-05**: Dane firmy (NIP, nazwa firmy) i status VAT pojawiaja sie w umowie PDF

### Flota (FLOTA)

- [x] **FLOTA-01**: Admin moze definiowac klasy samochodow w panelu webowym (np. Ekonomiczna, Komfort, SUV, Premium)
- [x] **FLOTA-02**: Admin moze przypisac klase do pojazdu przy dodawaniu/edycji
- [ ] **FLOTA-03**: Klasa pojazdu widoczna w liscie pojazdow i w szczegolach wynajmu
- [ ] **FLOTA-04**: Klient nie widzi numeru VIN ani roku produkcji pojazdu w portalu klienta
- [ ] **FLOTA-05**: Numer VIN i rok produkcji nie pojawiaja sie w PDF umowy wysylanej do klienta

### Umowa i warunki (UMOWA)

- [ ] **UMOWA-01**: Admin moze edytowac warunki najmu (druga strona umowy) w panelu webowym za pomoca edytora tekstu
- [ ] **UMOWA-02**: Pracownik moze dostosowac warunki najmu indywidualnie dla kazdego wynajmu
- [ ] **UMOWA-03**: Klient widzi warunki najmu i musi potwierdzic zapoznanie sie checkbox-em przed podpisem
- [ ] **UMOWA-04**: Pracownik moze dodac uwagi do warunkow najmu (pole tekstowe) -- uwagi pojawiaja sie w PDF
- [ ] **UMOWA-05**: PDF umowy jest szyfrowany haslem rownym numerowi rejestracyjnemu pojazdu
- [ ] **UMOWA-06**: Informacja o hasle do PDF wysylana jest SMS-em przy wynajmie (nie w emailu)
- [ ] **UMOWA-07**: Tytul emaila z umowa zawiera nr sprawy ubezpieczeniowej (jesli jest) + nr rejestracyjny pojazdu

### Wynajem (NAJEM)

- [x] **NAJEM-01**: Pracownik moze wpisac nr sprawy ubezpieczeniowej przy tworzeniu wynajmu (opcjonalne pole)
- [ ] **NAJEM-02**: Pracownik moze wybrac miejsce wydania pojazdu z autocomplete Google Places
- [ ] **NAJEM-03**: Pracownik moze wybrac miejsce zdania pojazdu z autocomplete Google Places
- [ ] **NAJEM-04**: Wybrana lokalizacja (adres) zapisywana jest w danych wynajmu
- [ ] **NAJEM-05**: Pracownik moze dodac drugiego kierowce (dane osobowe + nr prawa jazdy)
- [ ] **NAJEM-06**: Drugi kierowca weryfikowany jest przez CEPiK (tak jak glowny najemca)
- [ ] **NAJEM-07**: Dane drugiego kierowcy pojawiaja sie w umowie PDF

### Zwrot i rozliczenie (ZWROT)

- [ ] **ZWROT-01**: Przy zwrocie pojazdu generowany jest protokol zwrotu wg wzoru klienta
- [ ] **ZWROT-02**: Pracownik otrzymuje powiadomienie o koniecznosci pobrania VAT przy zwrocie (jesli klient jest platnikiem VAT)
- [ ] **ZWROT-03**: Admin moze oznaczyc wynajem jako rozliczony/nierozliczony w panelu webowym
- [ ] **ZWROT-04**: Panel webowy wyswietla liste nierozliczonych wynajmow z filtrowaniem

## v4.0 Requirements (Deferred)

- **DOC-F01**: OCR automatyczne rozpoznawanie typu dokumentu (dowod vs prawo jazdy)
- **FLOTA-F01**: Filtrowanie dostepnosci pojazdow wg klasy
- **FLOTA-F02**: Cennik powiazany z klasa pojazdu
- **NAJEM-F01**: Protokol zwrotu jako osobny PDF wysylany klientowi
- **ZWROT-F01**: Sledzenie czesciowych platnosci i kaucji w rozliczeniu

## Out of Scope

| Feature | Reason |
|---------|--------|
| Platnosci online | Wypozyczalnia rozlicza sie z klientem bezposrednio |
| Rezerwacja online | Wynajem odbywa sie na miejscu |
| Wielojezycznosc | Interfejs tylko po polsku |
| System ksiegowy | Reczne rozliczenia |
| OCR server-side (Cloud Vision) | On-device OCR (ML Kit) wystarczajace, lepsze dla RODO |
| Rich text editor w mobile | Warunki edytowane w web, mobile tylko wyswietla |
| Wielowidokowa mapa szkod | Jeden widok (top) wystarczajacy -- z v2.3 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DOC-01 | Phase 36 | Pending |
| DOC-02 | Phase 36 | Pending |
| DOC-03 | Phase 36 | Pending |
| DOC-04 | Phase 36 | Pending |
| DOC-05 | Phase 36 | Pending |
| DOC-06 | Phase 36 | Pending |
| KLIENT-01 | Phase 33 | Complete |
| KLIENT-02 | Phase 33 | Complete |
| KLIENT-03 | Phase 33 | Complete |
| KLIENT-04 | Phase 33 | Complete |
| KLIENT-05 | Phase 34 | Pending |
| FLOTA-01 | Phase 33 | Complete |
| FLOTA-02 | Phase 33 | Complete |
| FLOTA-03 | Phase 33 | Pending |
| FLOTA-04 | Phase 34 | Pending |
| FLOTA-05 | Phase 34 | Pending |
| UMOWA-01 | Phase 34 | Pending |
| UMOWA-02 | Phase 34 | Pending |
| UMOWA-03 | Phase 34 | Pending |
| UMOWA-04 | Phase 34 | Pending |
| UMOWA-05 | Phase 37 | Pending |
| UMOWA-06 | Phase 37 | Pending |
| UMOWA-07 | Phase 37 | Pending |
| NAJEM-01 | Phase 33 | Complete |
| NAJEM-02 | Phase 35 | Pending |
| NAJEM-03 | Phase 35 | Pending |
| NAJEM-04 | Phase 35 | Pending |
| NAJEM-05 | Phase 34 | Pending |
| NAJEM-06 | Phase 34 | Pending |
| NAJEM-07 | Phase 34 | Pending |
| ZWROT-01 | Phase 39 | Pending |
| ZWROT-02 | Phase 38 | Pending |
| ZWROT-03 | Phase 38 | Pending |
| ZWROT-04 | Phase 38 | Pending |

**Coverage:**
- v3.0 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0

---
*Requirements defined: 2026-04-12*
*Last updated: 2026-04-12 after roadmap creation*
