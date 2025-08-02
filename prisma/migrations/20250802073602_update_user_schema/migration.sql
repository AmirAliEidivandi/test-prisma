/*
  Warnings:

  - You are about to drop the column `address` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `birth_date` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `job_position` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `national_code` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[profile_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `profile_id` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "User_national_code_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "address",
DROP COLUMN "birth_date",
DROP COLUMN "email",
DROP COLUMN "first_name",
DROP COLUMN "job_position",
DROP COLUMN "last_name",
DROP COLUMN "national_code",
DROP COLUMN "phone",
ADD COLUMN     "profile_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_profile_id_key" ON "User"("profile_id");
