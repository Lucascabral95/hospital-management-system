-- CreateIndex
CREATE INDEX "Doctor_authId_idx" ON "Doctor"("authId");

-- CreateIndex
CREATE INDEX "MedicalRecord_doctorId_idx" ON "MedicalRecord"("doctorId");

-- CreateIndex
CREATE INDEX "MedicalRecord_patientsId_idx" ON "MedicalRecord"("patientsId");

-- CreateIndex
CREATE INDEX "Appointment_patientsId_idx" ON "Appointment"("patientsId");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "Appointment_scheduledAt_idx" ON "Appointment"("scheduledAt");

-- CreateIndex
CREATE INDEX "Interment_doctorId_idx" ON "Interment"("doctorId");

-- CreateIndex
CREATE INDEX "Interment_patientId_idx" ON "Interment"("patientId");

-- CreateIndex
CREATE INDEX "Interment_status_idx" ON "Interment"("status");

-- CreateIndex
CREATE INDEX "Diagnosis_intermentId_idx" ON "Diagnosis"("intermentId");
