-- Phase 39: Return Protocol
-- Manual migration following Phase 33/34/38 precedent (no shadow DB)

CREATE TABLE "return_protocols" (
  "id" TEXT NOT NULL,
  "rentalId" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "returnDateTime" TIMESTAMP(3) NOT NULL,
  "vehicleMakeModel" TEXT NOT NULL,
  "vehicleRegistration" TEXT NOT NULL,
  "returnLocation" TEXT,
  "cleanliness" TEXT NOT NULL,
  "cleanlinessNote" TEXT,
  "otherNotes" TEXT,
  "customerSignatureKey" TEXT NOT NULL,
  "workerSignatureKey" TEXT NOT NULL,
  "pdfKey" TEXT,
  "pdfGeneratedAt" TIMESTAMP(3),
  "emailSentAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "return_protocols_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "return_protocols_rentalId_key" ON "return_protocols"("rentalId");

ALTER TABLE "return_protocols" ADD CONSTRAINT "return_protocols_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "rentals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "return_protocols" ADD CONSTRAINT "return_protocols_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
