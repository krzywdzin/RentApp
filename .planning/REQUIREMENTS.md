# Requirements: RentApp

**Defined:** 2026-03-29
**Core Value:** Pracownik w terenie moze w pelni obsluzyc wynajem -- od wypelnienia umowy, przez zweryfikowanie uprawnien kierowcy, zrobienie zdjec auta, po podpis klienta i wysylke PDF -- bez papieru i bez powrotu do biura.

## v2.3 Requirements

Requirements for v2.3 milestone. Each maps to roadmap phases.

### Bug Fixes

- [ ] **BUG-01**: Clicking "Uzytkownicy" tab in web admin panel no longer causes logout
- [ ] **BUG-02**: Signature canvas clears properly between each of the 4 signature steps

### Authentication

- [ ] **AUTH-01**: API User model has username field added via Prisma migration
- [ ] **AUTH-02**: API auth accepts username OR email for login
- [ ] **AUTH-03**: Existing admin@kitek.pl account gets username "admin" via data migration
- [ ] **AUTH-04**: Web admin panel login uses username + password (not email)
- [ ] **AUTH-05**: Mobile app login uses username + password (not email)
- [ ] **AUTH-06**: Admin panel credentials are separate from mobile app credentials (different auth context)

### User Management

- [ ] **USER-01**: Admin can create worker accounts with username and temporary password in web panel
- [ ] **USER-02**: Worker creation stores proper passwordHash (not null)
- [ ] **USER-03**: Newly created worker can immediately log in to mobile app with set credentials
- [ ] **USER-04**: No email required for worker account creation

### Customer Search

- [ ] **SRCH-01**: Customer search by phone number works end-to-end (mobile + API)
- [ ] **SRCH-02**: Customer search by PESEL works end-to-end (mobile + API)
- [ ] **SRCH-03**: Customer search by last name works end-to-end (mobile + API)

### Vehicle Import

- [ ] **VIMP-01**: Web admin panel has upload interface for .xlsx and .csv vehicle files
- [ ] **VIMP-02**: Import parses uploaded file and creates vehicle records
- [ ] **VIMP-03**: Required fields are make, model, year, plate -- all others optional
- [ ] **VIMP-04**: Missing optional fields are left empty (no validation errors)
- [ ] **VIMP-05**: Import shows summary: X added, X skipped, X errors

### Damage Map

- [ ] **DMAP-01**: Interactive SVG car diagram replaces current damage checklist
- [ ] **DMAP-02**: Worker can tap on car body part to mark damage location
- [ ] **DMAP-03**: Each tap opens modal with damage type (scratch/dent/crack/other) + notes field
- [ ] **DMAP-04**: Marked damage points display visually on car outline

## Future Requirements

None deferred for this milestone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Password reset flow for workers | Not needed -- admin sets temporary password, worker uses it directly |
| Email-based worker notifications | Workers use mobile app, no email required |
| Vehicle import validation beyond required fields | Keep import simple -- missing optional fields are OK |
| Multi-vehicle damage map (per-vehicle SVG customization) | Single generic car outline sufficient for v2.3 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 28 | Pending |
| BUG-02 | Phase 28 | Pending |
| AUTH-01 | Phase 28 | Pending |
| AUTH-02 | Phase 28 | Pending |
| AUTH-03 | Phase 28 | Pending |
| AUTH-04 | Phase 29 | Pending |
| AUTH-05 | Phase 29 | Pending |
| AUTH-06 | Phase 29 | Pending |
| USER-01 | Phase 29 | Pending |
| USER-02 | Phase 29 | Pending |
| USER-03 | Phase 29 | Pending |
| USER-04 | Phase 29 | Pending |
| SRCH-01 | Phase 30 | Pending |
| SRCH-02 | Phase 30 | Pending |
| SRCH-03 | Phase 30 | Pending |
| VIMP-01 | Phase 31 | Pending |
| VIMP-02 | Phase 31 | Pending |
| VIMP-03 | Phase 31 | Pending |
| VIMP-04 | Phase 31 | Pending |
| VIMP-05 | Phase 31 | Pending |
| DMAP-01 | Phase 32 | Pending |
| DMAP-02 | Phase 32 | Pending |
| DMAP-03 | Phase 32 | Pending |
| DMAP-04 | Phase 32 | Pending |

**Coverage:**
- v2.3 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0

---
*Requirements defined: 2026-03-29*
*Last updated: 2026-03-29 after roadmap creation*
