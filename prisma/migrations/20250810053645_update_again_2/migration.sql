/*
  Warnings:

  - You are about to drop the column `address` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `job_position` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - Added the required column `kid` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `profile_id` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "address",
DROP COLUMN "job_position",
DROP COLUMN "phone",
ADD COLUMN     "kid" TEXT NOT NULL,
ALTER COLUMN "profile_id" SET NOT NULL;
