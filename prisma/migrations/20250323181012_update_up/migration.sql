/*
  Warnings:

  - A unique constraint covering the columns `[medicalRecordId]` on the table `Prescriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Prescriptions_medicalRecordId_key" ON "Prescriptions"("medicalRecordId");
