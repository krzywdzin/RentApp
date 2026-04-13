# Phase 36: OCR Document Scanning - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Workers can photograph a client's Polish ID card (dowod osobisty) and driver license (prawo jazdy) in the mobile app. The system extracts data via on-device OCR (ML Kit / expo-text-extractor) for RODO compliance. Worker reviews and corrects extracted fields before saving to the customer record. Document photos are stored in R2 and linked to the customer. Admin can view document photos in the web panel.

</domain>

<decisions>
## Implementation Decisions

### Flow skanowania
- Skan wbudowany w istniejacy krok klienta w kreatorze wynajmu — przyciski "Skanuj dowod" i "Skanuj prawo jazdy" wsrod pol formularza
- Dwa osobne przyciski (nie jeden przycisk + wybor typu) — jedno klikniecie otwiera kamere od razu
- Skan dostepny zarowno dla nowych jak i istniejacych klientow — przy nowym wype³nia puste pola, przy istniejacym proponuje aktualizacje (pracownik decyduje per pole)
- Skan jest opcjonalny — pracownik moze rowniez wpisac dane recznie. Skan to wygoda, nie wymuszenie
- Automatyczne rozpoznawanie typu dokumentu (DOC-F01) odroczone do v4.0 — pracownik wybiera recznie

### Podglad i korekta OCR
- Ekran potwierdzenia po skanie: miniaturka zdjecia u gory, wszystkie odczytane pola ponizej (edytowalne), przycisk "Zatwierdz"
- Pola z niskim wynikiem OCR lub brak odczytu sa puste i oznaczone kolorem (np. zolty/czerwony) — pracownik musi je wypelnic recznie
- Przy istniejacym kliencie: ekran pokazuje roznice miedzy obecnymi danymi a danymi z OCR obok siebie, pracownik wybiera co zaktualizowac (checkbox per pole)
- Pola z dowodu osobistego (DOC-03): imie, nazwisko, PESEL, nr dokumentu, adres (ulica, nr, kod, miasto)
- Pola z prawa jazdy (DOC-04): nr prawa jazdy, kategorie, data waznosci

### Robienie zdjecia dokumentu
- Ramka/prowadnica na ekranie kamery w proporcjach dokumentu (format ID-1) — pomaga ustawic dokument
- Przod + tyl dokumentu — dwa zdjecia per dokument (tyl dowodu ma adres)
- Tylko kamera na zywo — bez galerii (swieze zdjecie, lepsze dla audytu)
- Przycisk latarki (torch) na ekranie kamery — pomaga w slabym oswietleniu

### Przechowywanie i prywatnosc
- Zdjecia usuwane razem z danymi klienta (retentionExpiresAt) — spojne z istniejaca polityka retencji
- Dostep do zdjec dokumentow: tylko admin w panelu webowym. Pracownicy widza tylko podczas skanowania
- Panel admina: nowa sekcja "Dokumenty" na karcie klienta z miniaturkami zdjec dowodu i prawa jazdy, klik otwiera pelne zdjecie

### Claude's Discretion
- Implementacja nakładki kamery (expo-camera vs custom view)
- Struktura kluczy R2 dla zdjęć dokumentów
- Parsing/regex dla polskiego dowodu osobistego i prawa jazdy (MRZ vs visual OCR)
- Model bazodanowy dla dokumentów klienta (CustomerDocument entity)
- Kolejnosc skanowania (przod → tyl automatycznie vs manualnie)
- Dokładna logika porownywania danych istniejacych z OCR

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — DOC-01 through DOC-06 (document scanning requirements), DOC-F01 (deferred auto-recognition)

### OCR technology
- Decision from v3.0 roadmap: on-device ML Kit via `expo-text-extractor` — RODO compliance, no server-side Cloud Vision
- Blocker noted in STATE.md: requires EAS dev client build, not Expo Go

### Existing camera/photo patterns
- `apps/mobile/app/(tabs)/new-rental/photos.tsx` — Existing photo capture using expo-image-picker (vehicle photos pattern)
- `apps/mobile/src/stores/rental-draft.store.ts` — Draft store pattern for wizard state

### Customer model & encryption
- `apps/api/prisma/schema.prisma` — Customer model with encrypted PII fields (peselEncrypted, idNumberEncrypted, licenseNumEncrypted) and address fields (street, houseNumber, postalCode, city)
- Existing encryption flow must be used for OCR-extracted PII data

### Storage infrastructure
- `apps/api/src/storage/storage.service.ts` — R2/S3 storage service (upload, download, presigned URLs)
- `.planning/phases/07-photo-and-damage-documentation/07-CONTEXT.md` — Photo storage patterns, path-based keys, thumbnail generation decisions

### Prior phase decisions
- `.planning/phases/33-foundation-schema-simple-fields/33-CONTEXT.md` — Customer address fields added in Phase 33
- `.planning/phases/34-contractfrozendata-v2-pdf-template-rewrite/34-CONTEXT.md` — Customer data flow through frozen data

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `expo-image-picker` (v17.0.8): Already installed, used for vehicle photo capture — camera permissions pattern established
- `StorageService`: R2 upload/download/presigned URLs — reuse for document photo storage
- `WizardStepper` component: Existing wizard step UI in rental creation flow
- Customer encryption utilities: Existing encrypt/decrypt flow for PESEL, ID number, license number
- `useRentalDraftStore`: Zustand draft store for wizard state — extend with document scan data

### Established Patterns
- Camera capture: `ImagePicker.launchCameraAsync()` with quality 0.7, permission request flow
- NestJS module: module + controller + service + DTOs pattern
- Prisma: UUID PKs, encrypted JSON fields for PII
- R2 storage: `rentapp/` bucket with path-based keys (e.g., `photos/{rentalId}/...`)
- Toast notifications for permission errors

### Integration Points
- `apps/mobile/app/(tabs)/new-rental/index.tsx` — Customer step in rental wizard (scan buttons go here)
- `apps/api/src/customers/` — Customer service for updating customer data with OCR results
- `apps/api/prisma/schema.prisma` — New CustomerDocument model linking photos to customer
- `apps/web/` — Admin panel customer detail page — add "Dokumenty" section
- `packages/shared/src/types/` — Shared types for document scan DTOs

</code_context>

<specifics>
## Specific Ideas

- Dwa osobne przyciski "Skanuj dowod osobisty" i "Skanuj prawo jazdy" wbudowane w krok klienta formularza wynajmu
- Przod + tyl dokumentu (dwa zdjecia) — tyl dowodu zawiera adres zameldowania
- Ekran potwierdzenia z miniaturka zdjecia u gory i edytowalnymi polami ponizej
- Przy istniejacym kliencie: widok roznic (diff) miedzy obecnymi danymi a OCR — checkbox per pole do aktualizacji
- Pola bez odczytu sa puste i wyrosnione kolorem — wymuszaja reczne uzupelnienie
- Sekcja "Dokumenty" na karcie klienta w panelu admina z miniaturkami

</specifics>

<deferred>
## Deferred Ideas

- DOC-F01: Automatyczne rozpoznawanie typu dokumentu (dowod vs prawo jazdy) — v4.0
- Skanowanie dokumentow drugiego kierowcy — osobna faza jesli potrzebne
- Offline scan z synchronizacja w tle — odroczone

</deferred>

---

*Phase: 36-ocr-document-scanning*
*Context gathered: 2026-04-14*
