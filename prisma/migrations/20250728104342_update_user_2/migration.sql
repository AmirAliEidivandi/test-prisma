/*
  Warnings:

  - You are about to drop the column `profile_id` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_profile_id_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "profile_id";
