-- CreateTable: app_settings
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable: rental_drivers
CREATE TABLE "rental_drivers" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "peselEncrypted" JSONB NOT NULL,
    "peselHmac" TEXT NOT NULL,
    "idNumberEncrypted" JSONB NOT NULL,
    "idNumberHmac" TEXT NOT NULL,
    "licenseNumEncrypted" JSONB NOT NULL,
    "licenseNumHmac" TEXT NOT NULL,
    "licenseCategory" TEXT,
    "street" TEXT,
    "houseNumber" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_drivers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: rental_drivers unique rentalId
CREATE UNIQUE INDEX "rental_drivers_rentalId_key" ON "rental_drivers"("rentalId");

-- AlterTable rentals: add rentalTerms, termsNotes
ALTER TABLE "rentals" ADD COLUMN "rentalTerms" TEXT,
ADD COLUMN "termsNotes" TEXT;

-- AlterTable contracts: add termsAcceptedAt
ALTER TABLE "contracts" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);

-- AlterTable cepik_verifications: make customerId optional, add driverId
ALTER TABLE "cepik_verifications" ALTER COLUMN "customerId" DROP NOT NULL;
ALTER TABLE "cepik_verifications" ADD COLUMN "driverId" TEXT;

-- CreateIndex: cepik_verifications driverId
CREATE INDEX "cepik_verifications_driverId_idx" ON "cepik_verifications"("driverId");

-- AddForeignKey: rental_drivers -> rentals
ALTER TABLE "rental_drivers" ADD CONSTRAINT "rental_drivers_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "rentals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: cepik_verifications -> rental_drivers
ALTER TABLE "cepik_verifications" ADD CONSTRAINT "cepik_verifications_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "rental_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
