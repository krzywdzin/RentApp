# KITEK RentApp — Client Handover Notes

**Prepared:** 2026-04-17  
**System:** RentApp — Polish car rental management (web panel + mobile app)  
**Client:** KITEK / Paweł Romanowski  
**Developer:** Antoni Krzywdziński

---

## 1. First Login — Set Admin Password

The admin account has been reset for secure handover. **You must set a new password before the account is usable.**

**Admin account:** `admin` / `admin@kitek.pl`

To set the admin password, send this API request (e.g., with curl or any HTTP client):

```
POST https://api-production-977b.up.railway.app/auth/setup-password
Content-Type: application/json

{
  "token": "a8c025f40caf2d040cf039b9db17c8aa57dd5e669606459fafcc8a8216a79f78",
  "password": "YourNewPassword1!"
}
```

Password requirements: minimum 8 characters, must include uppercase, lowercase, digit, and special character.

**Token expires: 2026-04-20 (72 hours from handover).** If expired, contact the developer to generate a new one.

After setting the password, you can log into the web panel at:
https://web-production-53b27.up.railway.app

---

## 2. Existing Accounts

| Username | Email | Role | Status |
|----------|-------|------|--------|
| `admin` | admin@kitek.pl | ADMIN | Password reset — use setup flow above |
| `antoni` | antoni@kitek.pl | EMPLOYEE | Active (developer test account) |

**Action required:** Log in as admin and either delete the `antoni` employee account (Settings → Users) or repurpose it for a real employee.

---

## 3. Environment Variables to Change

The following Railway environment variables use the developer's personal services and **must be changed** before the system goes into production with real client data:

### Critical — Change Immediately

| Variable | Current Value | Action |
|----------|--------------|--------|
| `MAIL_FROM` | `noreply@krzywdzinski.tech` | Set to your domain, e.g., `noreply@kitek.pl` |
| `MAIL_PASS` | `re_6EUkx...` (developer's Resend key) | Create account at resend.com, get your API key |
| `MAIL_USER` | `resend` | Keep as `resend` if using Resend |
| `MAIL_HOST` | `smtp.resend.com` | Keep if using Resend |
| `GEMINI_API_KEY` | Developer's Google key | Create at console.cloud.google.com, enable Gemini API |

### Already Correct for KITEK

| Variable | Value | Notes |
|----------|-------|-------|
| `COMPANY_NAME` | KITEK | ✓ |
| `COMPANY_OWNER` | Paweł Romanowski | ✓ |
| `COMPANY_ADDRESS` | ul. Sieradzka 18, 87-100 Toruń | ✓ |
| `COMPANY_PHONE` | +48602367100 | ✓ |

### Do Not Change (Generated Secrets)

The following were generated securely and should remain as-is unless you rotate them:
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_MOBILE_SECRET`, `PORTAL_JWT_SECRET`
- `FIELD_ENCRYPTION_KEY` — **never change this** without migrating encrypted data

---

## 4. Database

**Provider:** Neon (PostgreSQL) — managed via DATABASE_URL in Railway  
**Connection:** Pooled (serverless-safe)

The database has been cleaned of all test data:
- ✅ Test customer (developer's personal account) — deleted
- ✅ All 7 test rentals (all RETURNED) — deleted
- ✅ All associated contracts, signatures, walkthroughs — deleted
- ✅ Audit logs for test data — deleted
- ✅ No stale DRAFT rentals

**The database is empty and ready for real data.**

---

## 5. Mobile App

The mobile app (KITEK Rental) is published via EAS under the developer's Expo account (`krzywdzinek`). Current builds will continue to work.

If you want to publish future updates independently:
1. Create an Expo account at expo.dev
2. Update `owner` in `apps/mobile/app.config.ts`
3. Update `eas.projectId` with your project ID
4. Run `eas build` to create new builds

The API URL in the mobile app is hardcoded to:
`https://api-production-977b.up.railway.app`

If you deploy a new Railway project, update `RAILWAY_API_URL` in:
- `apps/mobile/app.config.ts`
- `apps/mobile/src/lib/constants.ts`

---

## 6. Deploy to a New Railway Project (for a Fresh Instance)

To give the client their own independent Railway environment:

1. **Fork the repository** to client's GitHub account
2. **Create a new Railway project** and connect the repo
3. **Add services:**
   - API (NestJS) — from `apps/api`, Dockerfile or Railway auto-detect
   - Web (Next.js) — from `apps/web`
   - PostgreSQL — Railway native Postgres service
   - Redis — Railway native Redis or Upstash
4. **Set all env vars** from `.env.example` as starting point
5. **Generate new secrets:**
   ```bash
   openssl rand -base64 48   # for each JWT secret
   openssl rand -hex 32      # for FIELD_ENCRYPTION_KEY
   ```
6. **Run migrations:** `npx prisma migrate deploy` (runs automatically on deploy)
7. **Create first admin user** via the API:
   ```
   POST /users
   { "name": "Administrator", "username": "admin", "email": "admin@yourdomain.pl", "role": "ADMIN" }
   ```
   Use the returned setup token to set the password.

---

## 7. Known Limitations

- **PDF contract generation:** Requires S3-compatible storage (currently configured via `S3_*` env vars). Check that S3 is configured in production.
- **SMS notifications:** Requires SMSAPI token (`SMSAPI_TOKEN` env var). Currently in test mode.
- **OCR (document scanning):** Uses Google Gemini API. Requires valid `GEMINI_API_KEY`.
- **Email sending:** Uses Resend SMTP. Requires valid `MAIL_PASS` API key and verified sender domain.

---

## 8. Support

Contact the developer for:
- Regenerating expired setup tokens
- Database questions
- Feature requests or bug fixes
