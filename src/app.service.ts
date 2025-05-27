import { Injectable, InternalServerErrorException, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { auths, Doctors, patients, MedicalRecords, prescriptions, appointments } from "mock";
import * as bcrypt from "bcrypt";

@Injectable()
export class AppService extends PrismaClient implements OnModuleInit {
  onModuleInit() {
    this.$connect();
  }

  getHello(): string {
    return "Hello World!";
  }

  async createSeed() {
    try {
      await this.$executeRaw`TRUNCATE TABLE "Auth" RESTART IDENTITY CASCADE`;
      await this.$executeRaw`TRUNCATE TABLE "Doctor" RESTART IDENTITY CASCADE`;
      await this.$executeRaw`TRUNCATE TABLE "Patients" RESTART IDENTITY CASCADE`;
      await this.$executeRaw`TRUNCATE TABLE "MedicalRecord" RESTART IDENTITY CASCADE`;
      await this.$executeRaw`TRUNCATE TABLE "Prescriptions" RESTART IDENTITY CASCADE`;
      await this.$executeRaw`TRUNCATE TABLE "Appointment" RESTART IDENTITY CASCADE`;

      const seededAuths = await Promise.all(
        auths.map(async (auth) => {
          return {
            ...auth,
            password: await bcrypt.hash(auth.password, 10),
          };
        }),
      );

      await this.auth.createMany({
        data: seededAuths,
        skipDuplicates: true,
      });

      await this.doctor.createMany({
        data: Doctors,
        skipDuplicates: true,
      });

      await this.patients.createMany({
        data: patients,
        skipDuplicates: true,
      });

      await this.medicalRecord.createMany({
        data: MedicalRecords,
        skipDuplicates: true,
      });

      await this.prescriptions.createMany({
        data: prescriptions,
        skipDuplicates: true,
      });

      await this.appointment.createMany({
        data: appointments,
        skipDuplicates: true,
      });

      console.log("Seeded successfully");
      return "Seeded successfully";
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
