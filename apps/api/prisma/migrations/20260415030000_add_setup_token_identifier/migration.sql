-- Add setupTokenIdentifier for O(1) token lookup instead of iterating all users
ALTER TABLE "users" ADD COLUMN "setupTokenIdentifier" TEXT;
