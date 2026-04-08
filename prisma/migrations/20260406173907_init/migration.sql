/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SchoolType" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "BoardType" AS ENUM ('CBSE', 'ISC', 'STATE_BOARD');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CO_ADMIN', 'TEACHER', 'STUDENT', 'PARENT');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "schoolName" TEXT NOT NULL,
    "schoolType" "SchoolType" NOT NULL,
    "board" "BoardType" NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "websiteLink" TEXT,
    "fullName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "verificationDocLink" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "adminId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
