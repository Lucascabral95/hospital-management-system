/*
  Warnings:

  - You are about to drop the `AddressPatient` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AddressPatient" DROP CONSTRAINT "AddressPatient_patientsId_fkey";

-- AlterTable
ALTER TABLE "Patients" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "zip_code" TEXT,
ALTER COLUMN "date_born" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "AddressPatient";
