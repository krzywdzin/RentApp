-- AlterTable
ALTER TABLE "users" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "rentals" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;
