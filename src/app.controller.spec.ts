jest.mock(
  "mock/Interments",
  () => ({
    interments: [],
  }),
  { virtual: true },
);

jest.mock(
  "mock/Diagnosis",
  () => ({
    diagnosis: [],
  }),
  { virtual: true },
);

import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  let controller: AppController;
  let service: AppService;

  const mockAppService = {
    getHello: jest.fn(),
    createSeed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: mockAppService }],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getHello", () => {
    it("should return string from getHello", () => {
      const msg = "Hello World!";
      mockAppService.getHello.mockReturnValue(msg);

      const result = controller.getHello("admin");

      expect(service.getHello).toHaveBeenCalled();
      expect(result).toBe(msg);
    });
  });

  describe("health", () => {
    it("should return health status object", () => {
      const result = controller.health();

      expect(result).toHaveProperty("status", "ok");
      expect(result).toHaveProperty("timestamp");
      expect(typeof result.timestamp).toBe("string");
    });
  });

  describe("seed", () => {
    it("should call createSeed and return its response", () => {
      const seedResult = { seeded: true };
      mockAppService.createSeed.mockReturnValue(seedResult);

      const result = controller.seed("admin");

      expect(service.createSeed).toHaveBeenCalled();
      expect(result).toEqual(seedResult);
    });
  });
});
