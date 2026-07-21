import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { auths, Doctors, patients, MedicalRecords, prescriptions, appointments } from "mock";
import * as bcrypt from "bcrypt";
import { interments } from "mock/Interments";
import { diagnosis } from "mock/Diagnosis";
import { PrismaService } from "./prisma/prisma.service";

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return "Hello World!";
  }

  async createSeed() {
    try {
      await this.prisma.$executeRaw`TRUNCATE TABLE "Auth" RESTART IDENTITY CASCADE`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "Doctor" RESTART IDENTITY CASCADE`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "Patients" RESTART IDENTITY CASCADE`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "MedicalRecord" RESTART IDENTITY CASCADE`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "Prescriptions" RESTART IDENTITY CASCADE`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "Interment" RESTART IDENTITY CASCADE`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "Diagnosis" RESTART IDENTITY CASCADE`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "Appointment" RESTART IDENTITY CASCADE`;

      const seededAuths = await Promise.all(
        auths.map(async (auth) => {
          return {
            ...auth,
            password: await bcrypt.hash(auth.password, 10),
          };
        }),
      );

      await this.prisma.auth.createMany({
        data: seededAuths,
        skipDuplicates: true,
      });

      await this.prisma.doctor.createMany({
        data: Doctors,
        skipDuplicates: true,
      });

      await this.prisma.patients.createMany({
        data: patients,
        skipDuplicates: true,
      });

      await this.prisma.medicalRecord.createMany({
        data: MedicalRecords,
        skipDuplicates: true,
      });

      await this.prisma.prescriptions.createMany({
        data: prescriptions,
        skipDuplicates: true,
      });

      await this.prisma.interment.createMany({
        data: interments,
        skipDuplicates: true,
      });

      await this.prisma.diagnosis.createMany({
        data: diagnosis,
        skipDuplicates: true,
      });

      await this.prisma.appointment.createMany({
        data: appointments,
        skipDuplicates: true,
      });

      return "Seeded successfully";
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
