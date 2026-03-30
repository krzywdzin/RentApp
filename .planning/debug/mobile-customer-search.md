---
status: awaiting_human_verify
trigger: "Mobile customer search only searches by lastName. Should also support phone number and PESEL search."
created: 2026-03-29T00:00:00Z
updated: 2026-03-29T00:00:00Z
---

## Current Focus

hypothesis: searchCustomers in customers.api.ts hardcodes { lastName: query } regardless of input type
test: Read the API endpoint to confirm it accepts phone and pesel params
expecting: API accepts lastName, phone, pesel — confirmed in SearchCustomerDto and customers.service.ts
next_action: Fix searchCustomers to detect input type and send correct param

## Symptoms

expected: Customer search should detect input type and search by lastName, phone, or PESEL accordingly
actual: searchCustomers always sends { lastName: query }
errors: No errors, just limited functionality
reproduction: Try searching by phone number or PESEL in the mobile app customer search
started: Discovered during live testing

## Eliminated

(none)

## Evidence

- timestamp: 2026-03-29T00:01:00Z
  checked: apps/mobile/src/api/customers.api.ts
  found: Line 15 hardcodes params as { lastName: query }
  implication: This is the root cause — query type is never detected

- timestamp: 2026-03-29T00:02:00Z
  checked: apps/api/src/customers/customers.service.ts search method (line 183-211)
  found: API accepts dto with lastName, phone, pesel fields and builds WHERE clause accordingly
  implication: Backend already supports all three search types; only mobile client is limited

- timestamp: 2026-03-29T00:03:00Z
  checked: apps/mobile/src/i18n/pl.json
  found: Placeholder already says "Szukaj po nazwisku, telefonie lub PESEL..."
  implication: UI already hints at multi-field search; no placeholder change needed

## Resolution

root_cause: searchCustomers in apps/mobile/src/api/customers.api.ts always sends { lastName: query } without detecting whether the user typed a phone number or PESEL
fix: Add query type detection logic — 11 digits = PESEL, phone-like pattern = phone, otherwise = lastName
verification: TypeScript compiles with no errors. detectSearchParam correctly routes 11-digit input to pesel, phone-like input to phone, and everything else to lastName.
files_changed:
  - apps/mobile/src/api/customers.api.ts
