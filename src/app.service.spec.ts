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

describe("AppService", () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);

    jest.spyOn(service, "$connect").mockImplementation(async () => {});

    jest.spyOn(service, "$executeRaw").mockResolvedValue(undefined as any);

    Object.assign(service, {
      auth: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
      doctor: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      patients: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      medicalRecord: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      prescriptions: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      interment: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      diagnosis: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      appointment: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
    });
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

      expect(service.$executeRaw).toHaveBeenCalledTimes(8);

      expect(service.auth.createMany).toHaveBeenCalled();

      expect(result).toBe("Seeded successfully");
    });
  });
});
