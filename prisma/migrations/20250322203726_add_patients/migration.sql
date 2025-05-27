-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FAMALE', 'OTHER');

-- CreateTable
CREATE TABLE "Patients" (
    "id" SERIAL NOT NULL,
    "dni" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_born" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "is_admitted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddressPatient" (
    "id" SERIAL NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip_code" TEXT NOT NULL,
    "patientsId" INTEGER,

    CONSTRAINT "AddressPatient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patients_dni_key" ON "Patients"("dni");

-- AddForeignKey
ALTER TABLE "AddressPatient" ADD CONSTRAINT "AddressPatient_patientsId_fkey" FOREIGN KEY ("patientsId") REFERENCES "Patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
