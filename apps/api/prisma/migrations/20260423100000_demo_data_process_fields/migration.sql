-- Demo follow-up: deductible waiver payment method and per-rental invoice email.
ALTER TABLE "rentals"
  ADD COLUMN "companyInvoiceEmail" TEXT,
  ADD COLUMN "deductibleWaiverPaymentMethod" "PaymentMethod";
