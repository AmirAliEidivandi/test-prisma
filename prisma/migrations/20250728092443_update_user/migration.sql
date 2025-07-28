/*
  Warnings:

  - A unique constraint covering the columns `[national_code]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birth_date" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "national_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_national_code_key" ON "User"("national_code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
