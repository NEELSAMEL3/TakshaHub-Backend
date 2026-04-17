/*
  Warnings:

  - You are about to drop the column `failedAttempts` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lockUntil` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationOtpExpiry` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationOtpHash` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "failedAttempts",
DROP COLUMN "lockUntil",
DROP COLUMN "verificationOtpExpiry",
DROP COLUMN "verificationOtpHash";
