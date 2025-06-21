import { Status } from "@prisma/client";
import { CreateIntermentDto } from "src/interment/dto";

export const interments: CreateIntermentDto[] = [
  {
    doctorId: 8,
    patientId: 2,
    status: Status.PENDING,
  },
  {
    doctorId: 3,
    patientId: 4,
    status: Status.PENDING,
  },
  {
    doctorId: 12,
    patientId: 7,
    status: Status.PENDING,
  },
  {
    doctorId: 5,
    patientId: 9,
    status: Status.IN_PROGRESS,
  },
  {
    doctorId: 19,
    patientId: 11,
    status: Status.IN_PROGRESS,
  },
  {
    doctorId: 14,
    patientId: 15,
    status: Status.IN_PROGRESS,
  },
  {
    doctorId: 6,
    patientId: 17,
    status: Status.PENDING,
  },
  {
    doctorId: 17,
    patientId: 18,
    status: Status.PENDING,
  },
  {
    doctorId: 1,
    patientId: 19,
    status: Status.IN_PROGRESS,
  },
  {
    doctorId: 9,
    patientId: 20,
    status: Status.PENDING,
  },
];
