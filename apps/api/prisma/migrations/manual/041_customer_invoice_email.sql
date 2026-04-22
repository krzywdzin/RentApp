-- Separate invoice email for customers that rent as a company.
-- Personal `email` remains a private contact, `invoiceEmail` is used for
-- VAT invoices when `Rental.isCompanyRental = true`.
ALTER TABLE "customers"
  ADD COLUMN IF NOT EXISTS "invoiceEmail" TEXT;
