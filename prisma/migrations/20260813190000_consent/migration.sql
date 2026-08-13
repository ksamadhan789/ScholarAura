-- AlterTable
ALTER TABLE "users" ADD COLUMN "consentAcceptedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "marketingOptIn" BOOLEAN NOT NULL DEFAULT false;
