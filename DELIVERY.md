# RentApp — Instrukcja Wdrożenia u Klienta

## 1. Wymagane Subskrypcje (płatne)

### Railway (hosting API + Web)
- **Plan:** Hobby ($5/mies) lub Pro ($20/mies)
- **Hobby** wystarczy na start (do ~3 instancji, 512MB RAM)
- **Pro** jak ruch wzrośnie powyżej 100 aktywnych użytkowników
- URL: https://railway.app

### Neon PostgreSQL (baza danych)
- **Free tier wystarczy** do ~100 pojazdów / 15 pracowników
- **Launch ($19/mies)** jak potrzeba więcej niż 10GB storage lub SLA
- URL: https://neon.tech

### Resend (email)
- **Free tier:** 3000 emaili/mies, tylko zweryfikowane domeny
- **Pro ($20/mies):** nieograniczone domeny, 50k emaili/mies — **konieczny do produkcji**
- Wymaga weryfikacji domeny (DNS TXT record) dla własnej nazwy nadawcy
- URL: https://resend.com

### SMSAPI (SMS po polsku)
- **Płatność z góry** — doładuj konto (np. 50-100 PLN)
- Token jest już ustawiony: `CA4b29WbmAn7QtgBZYyKifvKLPzL0iGje0vCtVNg`
- Własny sender name (`RentApp`) wymaga rejestracji w SMSAPI (~kilka dni)
- Do czasu rejestracji działa sender `Test`
- URL: https://smsapi.pl

### MinIO / Cloudflare R2 (storage zdjęć)
- Obecna konfiguracja: MinIO na Railway (storage zdjęć pojazdów)
- Dla produkcji rozważ **Cloudflare R2** (darmowe 10GB, $0.015/GB powyżej)

---

## 2. Zmienne środowiskowe do ustawienia u klienta

W Railway → Service API → Variables ustaw:

```env
# Baza danych (Neon URL klienta)
DATABASE_URL=postgresql://...

# JWT (wygeneruj nowe, silne hasła!)
JWT_ACCESS_SECRET=<min 32 znaków random>
JWT_REFRESH_SECRET=<min 32 znaków random>
PORTAL_JWT_SECRET=<min 32 znaków random>

# Email (Resend)
MAIL_HOST=smtp.resend.com
MAIL_PORT=587
MAIL_USER=resend
MAIL_PASS=<Resend API key>
MAIL_FROM=noreply@<zweryfikowana-domena>

# SMS
SMSAPI_TOKEN=<token klienta>
SMSAPI_SENDER_NAME=<zarejestrowany sender lub Test>
SMSAPI_TEST_MODE=false

# App URL (URL web panelu klienta na Railway)
APP_URL=https://<web-service>.up.railway.app

# Storage (MinIO lub R2)
STORAGE_ENDPOINT=...
STORAGE_ACCESS_KEY=...
STORAGE_SECRET_KEY=...
STORAGE_BUCKET=rentapp
```

---

## 3. Czyszczenie bazy przed oddaniem

Uruchom ten SQL przez Neon Console (lub `psql`) **przed** przekazaniem:

```sql
-- UWAGA: Usuwa WSZYSTKIE dane testowe. Wykonaj tylko raz przed startem produkcji!

-- Kolejność ma znaczenie (foreign keys)
DELETE FROM "notifications";
DELETE FROM "audit_logs";
DELETE FROM "photo_walkthrough_photos";
DELETE FROM "photo_walkthroughs";
DELETE FROM "contract_signatures";
DELETE FROM "contracts";
DELETE FROM "damage_photos";
DELETE FROM "damage_markers";
DELETE FROM "rentals";
DELETE FROM "customers";
DELETE FROM "cepik_verifications";
DELETE FROM "vehicles";
DELETE FROM "refresh_tokens";

-- Usuń konta testowe (zostaw tylko admina klienta)
DELETE FROM "users" WHERE username NOT IN ('admin_klienta');

-- Reset sekwencji jeśli używane
-- (UUID primary keys - nie ma sekwencji do resetowania)
```

---

## 4. Nowe konto admina dla klienta

Po wyczyszczeniu bazy, utwórz nowe konto admina przez API lub seed:

```bash
# Przez API (z aktualnego konta admina):
curl -X POST https://<api-url>/users \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "<silne-haslo>",
    "email": "<email-klienta>",
    "role": "ADMIN"
  }'
```

Lub zaktualizuj istniejące konto admina przez Neon Console:
```sql
UPDATE "users" 
SET username = 'admin', 
    email = '<email-klienta>'
WHERE role = 'ADMIN';
-- Hasło zmień przez panel web (Ustawienia → Zmień hasło)
```

---

## 5. Kroki wdrożenia u nowego klienta

1. **Fork lub deploy repozytorium** na nowym Railway projekcie
2. **Utwórz nową bazę Neon** (nie używaj tej samej co dev)
3. **Ustaw zmienne środowiskowe** (sekcja 2 powyżej)
4. **Uruchom migracje:** `railway run npx prisma migrate deploy`
5. **Utwórz konto admina** przez seed lub API
6. **Skonfiguruj domeny** (opcjonalnie custom domain w Railway)
7. **Zweryfikuj domenę w Resend** (DNS TXT)
8. **Wgraj APK** na telefony pracowników

---

## 6. Linki do aktualnego deploymentu (KITEK)

- **API:** https://api-production-977b.up.railway.app
- **Web Panel:** https://web-production-53b27.up.railway.app
- **DB:** Neon → ep-rough-dew-al9nhf2o

---

## 7. Wgranie APK na Androida

```bash
# Podłącz telefon USB, włącz debugowanie USB
adb devices  # sprawdź czy widoczny
adb install -r -d RentApp.apk
```

Lub wyślij plik APK mailem/WhatsApp i zainstaluj ręcznie (wymaga: Ustawienia → Zezwól na instalację z nieznanych źródeł).
