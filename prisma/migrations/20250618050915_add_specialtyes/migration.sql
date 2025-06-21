-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Specialty" ADD VALUE 'FamilyMedicine';
ALTER TYPE "Specialty" ADD VALUE 'InternalMedicine';
ALTER TYPE "Specialty" ADD VALUE 'Pediatrics';
ALTER TYPE "Specialty" ADD VALUE 'Surgery';
ALTER TYPE "Specialty" ADD VALUE 'Neurology';
ALTER TYPE "Specialty" ADD VALUE 'Psychiatry';
ALTER TYPE "Specialty" ADD VALUE 'Dermatology';
ALTER TYPE "Specialty" ADD VALUE 'EmergencyMedicine';
ALTER TYPE "Specialty" ADD VALUE 'Cardiology';
