-- Phase 38: Settlement lifecycle fields
CREATE TYPE "SettlementStatus" AS ENUM ('NIEROZLICZONY', 'CZESCIOWO_ROZLICZONY', 'ROZLICZONY', 'ANULOWANY');

ALTER TABLE "rentals" ADD COLUMN "settlementStatus" "SettlementStatus" DEFAULT 'NIEROZLICZONY';
ALTER TABLE "rentals" ADD COLUMN "settlementAmount" INTEGER;
ALTER TABLE "rentals" ADD COLUMN "settlementNotes" TEXT;
ALTER TABLE "rentals" ADD COLUMN "settledAt" TIMESTAMP(3);

UPDATE "rentals" SET "settlementStatus" = 'NIEROZLICZONY' WHERE "settlementStatus" IS NULL;

ALTER TABLE "rentals" ALTER COLUMN "settlementStatus" SET NOT NULL;
ALTER TABLE "rentals" ALTER COLUMN "settlementStatus" SET DEFAULT 'NIEROZLICZONY';

CREATE INDEX "rentals_settlementStatus_idx" ON "rentals"("settlementStatus");
