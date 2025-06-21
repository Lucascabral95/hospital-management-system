-- CreateEnum
CREATE TYPE "DiagnosisCategory" AS ENUM ('ADMISSION', 'SECONDARY', 'COMPLICATION', 'COMORBIDITY', 'DISCHARGE');

-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "DiagnosisCategory" NOT NULL DEFAULT 'ADMISSION',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intermentId" INTEGER NOT NULL,

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_intermentId_fkey" FOREIGN KEY ("intermentId") REFERENCES "Interment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
