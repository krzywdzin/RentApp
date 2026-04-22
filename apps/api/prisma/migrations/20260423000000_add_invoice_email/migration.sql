-- AlterTable: separate invoice email for customers renting as a company.
-- Personal `email` remains a private contact, `invoiceEmail` holds the
-- billing email address used for VAT invoices.
ALTER TABLE "customers" ADD COLUMN "invoiceEmail" TEXT;
