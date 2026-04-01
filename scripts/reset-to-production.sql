-- ============================================================
-- RentApp — Reset bazy do stanu produkcyjnego
-- UWAGA: Usuwa WSZYSTKIE dane testowe!
-- Wykonaj przez Neon Console → SQL Editor
-- ============================================================

BEGIN;

-- 1. Usuń dane testowe (kolejność: najpierw zależne tabele)
DELETE FROM "in_app_notifications";
DELETE FROM "notifications";
DELETE FROM "audit_logs";
DELETE FROM "walkthrough_photos";
DELETE FROM "photo_walkthroughs";
DELETE FROM "contract_signatures";
DELETE FROM "damage_reports";
DELETE FROM "contract_annexes";
DELETE FROM "contracts";
DELETE FROM "rentals";
DELETE FROM "customers";
DELETE FROM "cepik_verifications";
DELETE FROM "vehicle_documents";
DELETE FROM "vehicle_inspections";
DELETE FROM "vehicle_insurance";
DELETE FROM "alert_configs";
DELETE FROM "vehicles";
DELETE FROM "refresh_tokens";

-- 2. Usuń konta testowe (zachowaj jednego admina)
DELETE FROM "users" WHERE role != 'ADMIN';
-- Jeśli chcesz też zmienić dane admina, zrób to przez panel web po zalogowaniu

-- 3. Potwierdź stan
SELECT id, username, email, role FROM "users";

COMMIT;
