# Requirements: RentApp

**Defined:** 2026-03-25
**Milestone:** v1.1 — Quality, Polish & UX Improvements
**Core Value:** Pracownik w terenie może w pełni obsłużyć wynajem — od wypełnienia umowy, przez zweryfikowanie uprawnień kierowcy, zrobienie zdjęć auta, po podpis klienta i wysyłkę PDF — bez papieru i bez powrotu do biura.

## v1.1 Requirements

### Mobile UX Polish (MOBUX)

- [x] **MOBUX-01**: All mobile list screens show loading skeletons while data is fetching (vehicle selection, return mileage, return confirm)
- [x] **MOBUX-02**: Customer search shows "type at least 2 characters" hint when query is empty, and a search-in-progress indicator while fetching
- [x] **MOBUX-03**: Rental detail screen shows error state with retry button when API request fails (instead of infinite skeleton)
- [x] **MOBUX-04**: Return wizard screens guard against missing rentalId with redirect to return start (prevent 0 km mileage bug)
- [x] **MOBUX-05**: OfflineBanner is included in return wizard layout (not just tab layout)
- [x] **MOBUX-06**: Dashboard greeting has fallback when user name is empty, and PDF open failure shows toast instead of silent catch
- [x] **MOBUX-07**: Error messages use human-readable status labels instead of raw enum values (e.g. return status guard)

### Web Admin Panel Polish (WEBUX)

- [x] **WEBUX-01**: User management page shows list of existing users with edit, deactivate, and password reset actions
- [x] **WEBUX-02**: Rental detail "Umowa" tab loads and displays the actual contract data using useContractByRental hook
- [x] **WEBUX-03**: Rental list shows vehicle registration and customer name instead of truncated UUIDs
- [x] **WEBUX-04**: Edit rental form uses Zod validation with inline error messages (same pattern as create form)
- [x] **WEBUX-05**: Audit page date filter is wired to the API query, and actor filter uses user dropdown instead of raw UUID input
- [x] **WEBUX-06**: Customer and vehicle detail rental tabs show Polish status labels and loading states
- [x] **WEBUX-07**: Dashboard and contract list show error states when API requests fail
- [x] **WEBUX-08**: Login page uses design system Input component instead of raw HTML input elements

### TypeScript Strictness (TSFIX)

- [x] **TSFIX-01**: Rental service methods return typed DTOs instead of Promise<any>, and use Prisma.TransactionClient for tx parameters
- [x] **TSFIX-02**: Contract service methods use typed parameters instead of any (toDto, rental, customer, vehicle params)
- [x] **TSFIX-03**: Damage service uses typed DamagePin accessor instead of `pins as any` casts on Prisma JSON columns
- [x] **TSFIX-04**: Portal controller uses typed PortalRequest interface instead of `@Req() req: any`
- [x] **TSFIX-05**: Web mutation hooks use specific input types (CreateVehicleInput, etc.) instead of Record<string, unknown>
- [x] **TSFIX-06**: Shared portal types replace `returnData: any | null` with typed DTO

### Dependency Fixes (DEPS)

- [x] **DEPS-01**: react-native-webview added as explicit dependency in mobile package.json
- [x] **DEPS-02**: Expo dependency versions aligned (expo-router uses tilde range, Sentry SDK version verified for SDK 54 compatibility)
- [x] **DEPS-03**: React version pins use tilde/caret ranges instead of exact pins where safe

### Test Coverage (TEST)

- [x] **TEST-01**: Web admin panel has component tests for critical pages (dashboard, rental list, vehicle list, customer list)
- [x] **TEST-02**: Mobile app has smoke tests for key screens (login, dashboard, rental list, new rental wizard steps)
- [x] **TEST-03**: API test coverage thresholds enforced in Jest config (statement coverage minimum)

### Performance (PERF)

- [x] **PERF-01**: Contract list query uses a batch/join approach instead of N+1 per-rental fetching
- [x] **PERF-02**: Customer and vehicle detail pages filter rentals server-side (query param) instead of fetching all rentals

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
| Wielojęzyczność / i18n | Polski rynek, v1.1 — hardcoded Polish strings are acceptable |
| Full E2E browser tests (Playwright) | Too heavy for v1.1 — component + unit tests first |
| Vehicle creation insurance/inspection fields | Low priority — can be added via edit after creation |
| Sidebar hydration flash fix | Cosmetic SSR issue, low impact |
| New vehicle form insurance/inspection fields | Can be set via edit page; not blocking |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MOBUX-01 | Phase 10 | Complete |
| MOBUX-02 | Phase 10 | Complete |
| MOBUX-03 | Phase 10 | Complete |
| MOBUX-04 | Phase 10 | Complete |
| MOBUX-05 | Phase 10 | Complete |
| MOBUX-06 | Phase 10 | Complete |
| MOBUX-07 | Phase 10 | Complete |
| WEBUX-01 | Phase 11 | Complete |
| WEBUX-02 | Phase 11 | Complete |
| WEBUX-03 | Phase 11 | Complete |
| WEBUX-04 | Phase 11 | Complete |
| WEBUX-05 | Phase 11 | Complete |
| WEBUX-06 | Phase 11 | Complete |
| WEBUX-07 | Phase 11 | Complete |
| WEBUX-08 | Phase 11 | Complete |
| TSFIX-01 | Phase 12 | Complete |
| TSFIX-02 | Phase 12 | Complete |
| TSFIX-03 | Phase 12 | Complete |
| TSFIX-04 | Phase 12 | Complete |
| TSFIX-05 | Phase 12 | Complete |
| TSFIX-06 | Phase 12 | Complete |
| DEPS-01 | Phase 13 | Complete |
| DEPS-02 | Phase 13 | Complete |
| DEPS-03 | Phase 13 | Complete |
| PERF-01 | Phase 13 | Complete |
| PERF-02 | Phase 13 | Complete |
| TEST-01 | Phase 14 | Complete |
| TEST-02 | Phase 14 | Complete |
| TEST-03 | Phase 14 | Complete |

**Coverage:**
- v1.1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after roadmap creation*
