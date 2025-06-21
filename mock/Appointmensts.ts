// export const appointments = [
//   {
//     patientsId: 1,
//   },
//   {
//     patientsId: 2,
//   },
//   {
//     patientsId: 3,
//   },
// ];

import { Status } from "@prisma/client";

export const appointments = [
  {
    patientsId: 1,
    status: Status.PENDING,
  },
  {
    patientsId: 2,
    status: Status.PENDING,
  },
  {
    patientsId: 3,
    status: Status.PENDING,
  },
  {
    patientsId: 4,
    status: Status.PENDING,
  },
  {
    patientsId: 5,
    status: Status.IN_PROGRESS,
  },
  {
    patientsId: 6,
    status: Status.IN_PROGRESS,
  },
  {
    patientsId: 7,
    status: Status.IN_PROGRESS,
  },
  {
    patientsId: 8,
    status: Status.IN_PROGRESS,
  },
  {
    patientsId: 9,
    status: Status.IN_PROGRESS,
  },
  {
    patientsId: 10,
    status: Status.COMPLETED,
  },
  {
    patientsId: 11,
    status: Status.COMPLETED,
  },
  {
    patientsId: 12,
    status: Status.COMPLETED,
  },
];
