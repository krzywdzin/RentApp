-- Add per-rental configurable terms fields
ALTER TABLE "rentals"
  ADD COLUMN "dailyKmLimit" INTEGER,
  ADD COLUMN "excessKmRate" INTEGER,
  ADD COLUMN "deposit" INTEGER,
  ADD COLUMN "returnDeadlineHour" VARCHAR(5),
  ADD COLUMN "lateReturnPenalty" INTEGER,
  ADD COLUMN "fuelLevelRequired" VARCHAR(20),
  ADD COLUMN "fuelCharge" INTEGER,
  ADD COLUMN "crossBorderAllowed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "dirtyReturnFee" INTEGER;
