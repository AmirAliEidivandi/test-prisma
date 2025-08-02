/*
  Warnings:

  - You are about to drop the column `profile_id` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[national_code]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_profile_id_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "profile_id",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "birth_date" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "job_position" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "national_code" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_national_code_key" ON "User"("national_code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
