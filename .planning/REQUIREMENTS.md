# Requirements: RentApp

**Defined:** 2026-03-29
**Core Value:** Pracownik w terenie może w pełni obsłużyć wynajem — od wypełnienia umowy, przez zweryfikowanie uprawnień kierowcy, zrobienie zdjęć auta, po podpis klienta i wysyłkę PDF — bez papieru i bez powrotu do biura.

## v2.3 Requirements

Requirements for v2.3 milestone. Each maps to roadmap phases.

### Bug Fixes

- [ ] **BUG-01**: Clicking "Użytkownicy" tab in web admin panel no longer causes logout
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
- [ ] **VIMP-03**: Required fields are make, model, year, plate — all others optional
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
| Password reset flow for workers | Not needed — admin sets temporary password, worker uses it directly |
| Email-based worker notifications | Workers use mobile app, no email required |
| Vehicle import validation beyond required fields | Keep import simple — missing optional fields are OK |
| Multi-vehicle damage map (per-vehicle SVG customization) | Single generic car outline sufficient for v2.3 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | TBD | Pending |
| BUG-02 | TBD | Pending |
| AUTH-01 | TBD | Pending |
| AUTH-02 | TBD | Pending |
| AUTH-03 | TBD | Pending |
| AUTH-04 | TBD | Pending |
| AUTH-05 | TBD | Pending |
| AUTH-06 | TBD | Pending |
| USER-01 | TBD | Pending |
| USER-02 | TBD | Pending |
| USER-03 | TBD | Pending |
| USER-04 | TBD | Pending |
| SRCH-01 | TBD | Pending |
| SRCH-02 | TBD | Pending |
| SRCH-03 | TBD | Pending |
| VIMP-01 | TBD | Pending |
| VIMP-02 | TBD | Pending |
| VIMP-03 | TBD | Pending |
| VIMP-04 | TBD | Pending |
| VIMP-05 | TBD | Pending |
| DMAP-01 | TBD | Pending |
| DMAP-02 | TBD | Pending |
| DMAP-03 | TBD | Pending |
| DMAP-04 | TBD | Pending |

**Coverage:**
- v2.3 requirements: 24 total
- Mapped to phases: 0
- Unmapped: 24 ⚠️

---
*Requirements defined: 2026-03-29*
*Last updated: 2026-03-29 after initial definition*
