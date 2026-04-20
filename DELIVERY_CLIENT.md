# RentApp — Notatka Przekazania Klientowi (dla Antoniego)

Cel: szybka ściąga, co powiedzieć klientowi (KITEK), co skonfigurować przed oddaniem oraz co jest świadomie „ręczne” a nie automatyczne. Uzupełnia `DELIVERY.md` i `DEPLOY-CHECKLIST.md`.

---

## 1. Terminologia — co mówić klientowi

- **Admin** = właściciel firmy / osoba zarządzająca. W panelu ma pełny dostęp: klienci, pojazdy, wynajmy, użytkownicy, ustawienia, audyt.
- **Employee / Pracownik** = każdy pracownik obsługujący wydania/zwroty z poziomu aplikacji mobilnej. Brak dostępu do ustawień i zarządzania użytkownikami.
- **Portal klienta** = link wysyłany klientowi (token 30 dni) do pobrania dokumentów i PDF-ów umowy. Nie wymaga logowania hasłem.

Klientowi należy powiedzieć wprost: „w systemie jest tylko jedno konto admina — to Wasze konto właściciela. Pracowników dodajecie sami z panelu, w zakładce Użytkownicy.”

---

## 2. CEPiK — ważne do wyjaśnienia

**CEPiK nie jest zintegrowany bezpośrednio.** W Polsce dostęp do CEPiK (bazy Ministerstwa Cyfryzacji) dla przewoźników wymaga formalnego wniosku (`biurocepik2.0@cyfra.gov.pl`). Do czasu uzyskania dostępu:

- Kod w `apps/api/src/cepik/cepik.service.ts` jest **stubem** — zawsze zwraca „licencja ważna, kategoria B”.
- W praktyce pracownik skanuje prawo jazdy (OCR), a weryfikacja CEPiK działa jako „szybki skrót” — zapisuje fakt weryfikacji w audycie, ale nie sprawdza faktycznie w bazie państwowej.
- Admin może ręcznie **nadpisać** (`override`) wynik weryfikacji ze wskazaniem powodu — to jest główna ścieżka audytowa dla przypadków spornych.

Co powiedzieć klientowi: „weryfikacja CEPiK na razie działa jako checkpoint operacyjny — zapis w systemie, że pracownik sprawdził dokument. Pełna integracja z bazą państwową będzie możliwa, gdy uzyskacie oficjalny dostęp CEPiK Carriers API.”

---

## 3. Zmienne środowiskowe — must-have przed startem

Pełna tabela jest w `DEPLOY-CHECKLIST.md` — najważniejsze do ustawienia u klienta:

| Grupa | Klucze |
|-------|--------|
| Baza / cache | `DATABASE_URL`, `REDIS_URL` |
| JWT (osobne sekrety 48+ znaków) | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PORTAL_JWT_SECRET` |
| Szyfrowanie PII (PESEL, dowód) | `FIELD_ENCRYPTION_KEY` — 64-znakowy hex, raz wygenerowany, NIE zmieniać po starcie |
| SMS | `SMSAPI_TOKEN`, `SMSAPI_SENDER_NAME` (domyślnie `KITEK` lub `Test` do czasu aktywacji), `SMSAPI_TEST_MODE=false` |
| Email | `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` |
| Storage | `S3_ENDPOINT`, `S3_REGION=auto`, `S3_BUCKET=rentapp`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` |
| Firma (na PDF) | `COMPANY_NAME`, `COMPANY_OWNER`, `COMPANY_ADDRESS`, `COMPANY_PHONE` |
| URL | `APP_URL` (URL web panelu), `CORS_ORIGINS` |
| OCR | `GEMINI_API_KEY` (bez niego OCR spada na regex fallback) |

**UWAGA na `FIELD_ENCRYPTION_KEY`:** jeśli go podmienisz po zapisaniu klientów, dane PESEL/dowód staną się nieodszyfrowalne. Raz wygenerować i przechować bezpiecznie.

---

## 4. Reset hasła admina u klienta

Dostępne są dwie ścieżki:

**A. Self-service mailem** (jeśli SMTP działa):
1. Klient na stronie logowania klika „Zapomniałem hasła”, podaje email.
2. Backend wywołuje `POST /auth/reset-password-request` → mail z linkiem tokena.
3. Klient wchodzi na link, ustawia nowe hasło (`POST /auth/reset-password`).

**B. Awaryjna — ręczna przez bazę** (gdy SMTP nie działa):
1. Wygenerować hash argon2 z nowego hasła: `npx -w apps/api ts-node scripts/hash-password.ts '<nowe-haslo>'` (lub po prostu w node REPL z `argon2.hash`).
2. `UPDATE "users" SET "passwordHash" = '<hash>' WHERE username = 'admin';`
3. Poinformować klienta o nowym haśle kanałem bezpiecznym — klient ma zmienić je po pierwszym logowaniu.

---

## 5. Przepływy krytyczne — co powiedzieć klientowi, że działa

### Logowanie
- Web panel: admin loguje się na `app.kitek.pl` (lub URL Railway); JWT 24h, refresh 30 dni.
- Mobile: pracownicy logują się tym samym loginem/hasłem. Token mobilny akceptowany przez `/users/me` — jeśli logowanie działa a getMe wali → sprawdzić strategię JWT, to jest znany wcześniejszy incydent.

### OCR dokumentów (mobile)
- Dwa przyciski: „Skanuj dowód” i „Skanuj prawo jazdy” w kreatorze nowego wynajmu.
- Kolejność fallbacków: Gemini Vision → Gemini tekst z `expo-text-extractor` → regex lokalny.
- W tym wydaniu poprawiono ekstrakcję dla prawa jazdy: **data ważności, nr blankietu, organ wydający** (dodane do typu, promptów Gemini i parsera regex).
- OCR dla dowodu osobistego pozostaje bez zmian.

### PDF umowy — hasło i SMS
- Po podpisaniu umowy system:
  1. Generuje PDF (Puppeteer/Chromium w kontenerze API).
  2. Szyfruje go **numerem rejestracyjnym pojazdu** jako hasłem (`pdf-encrypt-lite`).
  3. Wysyła mailem do klienta (jeśli ma email).
  4. Dopiero po udanym mailu wysyła SMS-em hasło: `„Haslo do PDF umowy: <REJ>. KITEK”`.
- SMS pojedyncze (płatne osobno). Numer rejestracyjny = hasło — klient zapamiętuje łatwo.
- Jeśli szyfrowanie lub mail padną, SMS nie idzie (zgodne z RODO).

### Aneks przez SMS (przedłużenie)
- Aneks generuje nowy PDF tym samym mechanizmem (hasło = rejestracja).
- SMS z hasłem leci po mailu. Klient widzi nowy PDF w swoim portalu albo w mailu.
- Klient musi mieć zapisany email i telefon — kluczowe.

---

## 6. Co jest świadomie NIE automatyczne

| Element | Status | Powód |
|---------|--------|-------|
| CEPiK | Stub + ręczny override | Brak dostępu państwowego API |
| Build mobile (APK / iOS) | Ręczny `eas build` | Nie w CI/CD — decyzja świadoma (koszty EAS + manualna kontrola wersji) |
| Weryfikacja domeny SMTP (Resend) | Ręczna — DNS TXT klienta | Wymaga dostępu klienta do panelu domeny |
| Weryfikacja sender name w SMSAPI | Ręczna (kilka dni po rejestracji) | Proces SMSAPI |
| Reset `FIELD_ENCRYPTION_KEY` | Zabronione po wdrożeniu | Jednokierunkowa operacja — straciłoby się dane PESEL |
| Tworzenie pierwszego admina | Ręczny seed/SQL | Bezpieczeństwo: brak publicznego endpointu rejestracji |
| Migracje DB | Automatyczne przy starcie API | `startCommand: npx prisma migrate deploy && node dist/main.js` |

---

## 7. Checklist tuż przed przekazaniem (mini)

- [ ] `FIELD_ENCRYPTION_KEY` wygenerowany i zapisany w bezpiecznym menedżerze haseł klienta.
- [ ] `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PORTAL_JWT_SECRET` — każdy inny, min. 48 znaków.
- [ ] `SMSAPI_TEST_MODE=false`, saldo SMSAPI doładowane.
- [ ] `MAIL_FROM` wskazuje na zweryfikowaną domenę klienta.
- [ ] Baza wyczyszczona z danych testowych (sekcja 3 `DELIVERY.md`), zostawione tylko jedno konto admina klienta.
- [ ] Admin klienta zmienił hasło po pierwszym logowaniu.
- [ ] APK wgrany na przynajmniej jeden telefon pracownika — zalogowano się i wykonano testowy wynajem.
- [ ] Wygenerowano testową umowę — mail + SMS z hasłem doszły.
- [ ] Dane firmy (`COMPANY_*`) ustawione — widoczne w PDF umowy.
- [ ] Klient ma login do paneli: Railway, Neon, Upstash, Cloudflare R2, SMSAPI, Resend (albo przynajmniej klucze w bezpiecznym miejscu).

---

## 8. „Co powiedzieć klientowi” — wersja skrócona

1. System jest działający i gotowy do użycia. Mobilka — dla pracowników, Web — dla Was (admin).
2. CEPiK na razie jest operacyjnym checkpointem (zapis audytowy), pełna integracja po uzyskaniu dostępu CEPiK Carriers.
3. Hasło do PDF umowy = numer rejestracyjny pojazdu. SMS-em przychodzi tylko przypomnienie.
4. Wszystkie dane osobowe (PESEL, dowód, prawo jazdy) są szyfrowane w bazie — nikt poza Wami nie widzi surowych wartości.
5. Reset hasła: przez email (przycisk „Zapomniałem hasła”) albo awaryjnie przez Antoniego.
6. Na początek doładować SMSAPI min. 50 PLN i zgłosić sender name `KITEK` do aktywacji.
7. W razie problemów — dzwonić do Antoniego, mamy pełny audyt logów (każda zmiana w bazie jest zapisana).
