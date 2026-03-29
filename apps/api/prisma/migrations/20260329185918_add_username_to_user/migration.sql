-- AlterTable
ALTER TABLE "users" ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- DataMigration: Set username for admin account
UPDATE "users" SET "username" = 'admin' WHERE "email" = 'admin@kitek.pl';
