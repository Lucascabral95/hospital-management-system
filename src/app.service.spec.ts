jest.mock("mock/Interments", () => ({ interments: [] }), { virtual: true });
jest.mock("mock/Diagnosis", () => ({ diagnosis: [] }), { virtual: true });
jest.mock(
  "mock",
  () => ({
    auths: [{ password: "password123" }],
    Doctors: [],
    patients: [],
    MedicalRecords: [],
    prescriptions: [],
    appointments: [],
  }),
  { virtual: true },
);

jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password"),
}));

import { Test, TestingModule } from "@nestjs/testing";
import { AppService } from "./app.service";
import { PrismaService } from "./prisma/prisma.service";

describe("AppService", () => {
  let service: AppService;

  const mockPrismaService = {
    $executeRaw: jest.fn().mockResolvedValue(undefined),
    auth: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
    doctor: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
    patients: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
    medicalRecord: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
    prescriptions: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
    interment: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
    diagnosis: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
    appointment: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getHello", () => {
    it("should return Hello World string", () => {
      expect(service.getHello()).toBe("Hello World!");
    });
  });

  describe("createSeed", () => {
    it("should execute truncates and seed data successfully", async () => {
      const result = await service.createSeed();

      expect(mockPrismaService.$executeRaw).toHaveBeenCalledTimes(8);

      expect(mockPrismaService.auth.createMany).toHaveBeenCalled();

      expect(result).toBe("Seeded successfully");
    });
  });
});
