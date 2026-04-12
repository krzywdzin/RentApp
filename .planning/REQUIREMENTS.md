# Requirements: RentApp v3.0

**Defined:** 2026-04-12
**Core Value:** Pracownik w terenie może w pełni obsłużyć wynajem — od wypełnienia umowy, przez zweryfikowanie uprawnień kierowcy, zrobienie zdjęć auta, po podpis klienta i wysyłkę PDF — bez papieru i bez powrotu do biura.

## v3.0 Requirements

Requirements for v3.0 Client Features & Contract Enhancements. Each maps to roadmap phases.

### Dokumenty klienta (DOC)

- [ ] **DOC-01**: Pracownik może zrobić zdjęcie dowodu osobistego klienta w aplikacji mobilnej
- [ ] **DOC-02**: Pracownik może zrobić zdjęcie prawa jazdy klienta w aplikacji mobilnej
- [ ] **DOC-03**: System automatycznie odczytuje dane z dowodu osobistego (OCR): imię, nazwisko, PESEL, nr dokumentu, adres
- [ ] **DOC-04**: System automatycznie odczytuje dane z prawa jazdy (OCR): nr prawa jazdy, kategorie, data ważności
- [ ] **DOC-05**: Pracownik może poprawić/uzupełnić dane po OCR przed zapisem
- [ ] **DOC-06**: Zdjęcia dokumentów zapisywane są w storage (R2) i powiązane z klientem

### Dane klienta (KLIENT)

- [ ] **KLIENT-01**: Pracownik może oznaczyć klienta jako firmę (checkbox) i wpisać NIP
- [ ] **KLIENT-02**: System waliduje format NIP (10 cyfr, suma kontrolna)
- [ ] **KLIENT-03**: Pracownik może ustawić status płatnika VAT klienta: 100%, 50%, nie
- [ ] **KLIENT-04**: Pracownik może wpisać adres klienta w aplikacji mobilnej (ulica, nr, kod, miasto)
- [ ] **KLIENT-05**: Dane firmy (NIP, nazwa firmy) i status VAT pojawiają się w umowie PDF

### Flota (FLOTA)

- [ ] **FLOTA-01**: Admin może definiować klasy samochodów w panelu webowym (np. Ekonomiczna, Komfort, SUV, Premium)
- [ ] **FLOTA-02**: Admin może przypisać klasę do pojazdu przy dodawaniu/edycji
- [ ] **FLOTA-03**: Klasa pojazdu widoczna w liście pojazdów i w szczegółach wynajmu
- [ ] **FLOTA-04**: Klient nie widzi numeru VIN ani roku produkcji pojazdu w portalu klienta
- [ ] **FLOTA-05**: Numer VIN i rok produkcji nie pojawiają się w PDF umowy wysyłanej do klienta

### Umowa i warunki (UMOWA)

- [ ] **UMOWA-01**: Admin może edytować warunki najmu (druga strona umowy) w panelu webowym za pomocą edytora tekstu
- [ ] **UMOWA-02**: Pracownik może dostosować warunki najmu indywidualnie dla każdego wynajmu
- [ ] **UMOWA-03**: Klient widzi warunki najmu i musi potwierdzić zapoznanie się checkbox-em przed podpisem
- [ ] **UMOWA-04**: Pracownik może dodać uwagi do warunków najmu (pole tekstowe) — uwagi pojawiają się w PDF
- [ ] **UMOWA-05**: PDF umowy jest szyfrowany hasłem równym numerowi rejestracyjnemu pojazdu
- [ ] **UMOWA-06**: Informacja o haśle do PDF wysyłana jest SMS-em przy wynajmie (nie w emailu)
- [ ] **UMOWA-07**: Tytuł emaila z umową zawiera nr sprawy ubezpieczeniowej (jeśli jest) + nr rejestracyjny pojazdu

### Wynajem (NAJEM)

- [ ] **NAJEM-01**: Pracownik może wpisać nr sprawy ubezpieczeniowej przy tworzeniu wynajmu (opcjonalne pole)
- [ ] **NAJEM-02**: Pracownik może wybrać miejsce wydania pojazdu z autocomplete Google Places
- [ ] **NAJEM-03**: Pracownik może wybrać miejsce zdania pojazdu z autocomplete Google Places
- [ ] **NAJEM-04**: Wybrana lokalizacja (adres) zapisywana jest w danych wynajmu
- [ ] **NAJEM-05**: Pracownik może dodać drugiego kierowcę (dane osobowe + nr prawa jazdy)
- [ ] **NAJEM-06**: Drugi kierowca weryfikowany jest przez CEPiK (tak jak główny najemca)
- [ ] **NAJEM-07**: Dane drugiego kierowcy pojawiają się w umowie PDF

### Zwrot i rozliczenie (ZWROT)

- [ ] **ZWROT-01**: Przy zwrocie pojazdu generowany jest protokół zwrotu wg wzoru klienta
- [ ] **ZWROT-02**: Pracownik otrzymuje powiadomienie o konieczności pobrania VAT przy zwrocie (jeśli klient jest płatnikiem VAT)
- [ ] **ZWROT-03**: Admin może oznaczyć wynajem jako rozliczony/nierozliczony w panelu webowym
- [ ] **ZWROT-04**: Panel webowy wyświetla listę nierozliczonych wynajmów z filtrowaniem

## v4.0 Requirements (Deferred)

- **DOC-F01**: OCR automatyczne rozpoznawanie typu dokumentu (dowód vs prawo jazdy)
- **FLOTA-F01**: Filtrowanie dostępności pojazdów wg klasy
- **FLOTA-F02**: Cennik powiązany z klasą pojazdu
- **NAJEM-F01**: Protokół zwrotu jako osobny PDF wysyłany klientowi
- **ZWROT-F01**: Śledzenie częściowych płatności i kaucji w rozliczeniu

## Out of Scope

| Feature | Reason |
|---------|--------|
| Płatności online | Wypożyczalnia rozlicza się z klientem bezpośrednio |
| Rezerwacja online | Wynajem odbywa się na miejscu |
| Wielojęzyczność | Interfejs tylko po polsku |
| System księgowy | Ręczne rozliczenia |
| OCR server-side (Cloud Vision) | On-device OCR (ML Kit) wystarczające, lepsze dla RODO |
| Rich text editor w mobile | Warunki edytowane w web, mobile tylko wyświetla |
| Wielowidokowa mapa szkód | Jeden widok (top) wystarczający — z v2.3 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| (To be filled by roadmapper) | | |

**Coverage:**
- v3.0 requirements: 30 total
- Mapped to phases: 0
- Unmapped: 30 ⚠️

---
*Requirements defined: 2026-04-12*
*Last updated: 2026-04-12 after initial definition*
