-- CreateEnum
CREATE TYPE "VatPayerStatus" AS ENUM ('FULL_100', 'HALF_50', 'NONE');

-- CreateTable
CREATE TABLE "vehicle_classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_classes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_classes_name_key" ON "vehicle_classes"("name");

-- Insert default vehicle class
INSERT INTO "vehicle_classes" ("id", "name", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Nieokreslona', NOW(), NOW());

-- AlterTable vehicles: add vehicleClassId as NULLABLE first
ALTER TABLE "vehicles" ADD COLUMN "vehicleClassId" TEXT;

-- Backfill existing vehicles with default class
UPDATE "vehicles" SET "vehicleClassId" = (SELECT "id" FROM "vehicle_classes" WHERE "name" = 'Nieokreslona' LIMIT 1);

-- Make vehicleClassId NOT NULL after backfill
ALTER TABLE "vehicles" ALTER COLUMN "vehicleClassId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_vehicleClassId_fkey" FOREIGN KEY ("vehicleClassId") REFERENCES "vehicle_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable customers: drop old address, add structured fields
ALTER TABLE "customers" DROP COLUMN "address",
ADD COLUMN     "street" TEXT,
ADD COLUMN     "houseNumber" TEXT,
ADD COLUMN     "apartmentNumber" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "city" TEXT;

-- AlterTable rentals: add company/insurance fields
ALTER TABLE "rentals" ADD COLUMN     "isCompanyRental" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "companyNip" TEXT,
ADD COLUMN     "vatPayerStatus" "VatPayerStatus",
ADD COLUMN     "insuranceCaseNumber" TEXT;
