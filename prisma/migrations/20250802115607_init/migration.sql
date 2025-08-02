/*
  Warnings:

  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `national_code` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."User_email_key";

-- DropIndex
DROP INDEX "public"."User_national_code_key";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "email",
DROP COLUMN "first_name",
DROP COLUMN "last_name",
DROP COLUMN "national_code",
ADD COLUMN     "profile_id" TEXT;
