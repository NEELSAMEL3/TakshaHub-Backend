/*
  Warnings:

  - You are about to drop the column `verificationTokenExpiry` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationTokenHash` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "verificationTokenExpiry",
DROP COLUMN "verificationTokenHash",
ADD COLUMN     "verificationOtpExpiry" TIMESTAMP(3),
ADD COLUMN     "verificationOtpHash" TEXT;
