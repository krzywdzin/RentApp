-- Phase 38: Settlement lifecycle fields
CREATE TYPE "SettlementStatus" AS ENUM ('NIEROZLICZONY', 'CZESCIOWO_ROZLICZONY', 'ROZLICZONY', 'ANULOWANY');

ALTER TABLE "Rental" ADD COLUMN "settlementStatus" "SettlementStatus" DEFAULT 'NIEROZLICZONY';
ALTER TABLE "Rental" ADD COLUMN "settlementAmount" INTEGER;
ALTER TABLE "Rental" ADD COLUMN "settlementNotes" TEXT;
ALTER TABLE "Rental" ADD COLUMN "settledAt" TIMESTAMP(3);

UPDATE "Rental" SET "settlementStatus" = 'NIEROZLICZONY' WHERE "settlementStatus" IS NULL;

ALTER TABLE "Rental" ALTER COLUMN "settlementStatus" SET NOT NULL;
ALTER TABLE "Rental" ALTER COLUMN "settlementStatus" SET DEFAULT 'NIEROZLICZONY';

CREATE INDEX "Rental_settlementStatus_idx" ON "Rental"("settlementStatus");
