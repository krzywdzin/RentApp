-- Customer profile files, including manual kierowca.gov.pl PDF reports.
CREATE TABLE "customer_files" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "fileKey" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uploadedById" TEXT NOT NULL,
  CONSTRAINT "customer_files_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "customer_files_customerId_idx" ON "customer_files"("customerId");
CREATE INDEX "customer_files_type_idx" ON "customer_files"("type");
ALTER TABLE "customer_files" ADD CONSTRAINT "customer_files_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_files" ADD CONSTRAINT "customer_files_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
