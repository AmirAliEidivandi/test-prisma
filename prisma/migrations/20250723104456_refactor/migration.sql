/*
  Warnings:

  - You are about to drop the column `jobPosition` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profileId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[profile_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_profileId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "jobPosition",
DROP COLUMN "profileId",
ADD COLUMN     "job_position" TEXT,
ADD COLUMN     "profile_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_profile_id_key" ON "User"("profile_id");
