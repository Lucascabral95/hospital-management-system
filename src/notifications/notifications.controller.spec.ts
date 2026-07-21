import { Test, TestingModule } from "@nestjs/testing";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

describe("NotificationsController", () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotificationsService = {
    findAllForUser: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: mockNotificationsService }],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should call service.findAllForUser with the current user's id", async () => {
      const req = { user: { id: 5 } } as any;
      const paginationDto = { page: 1, limit: 10 } as any;
      const expected = { data: [], total: 0 };
      mockNotificationsService.findAllForUser.mockResolvedValue(expected);

      const result = await controller.findAll(req, paginationDto);

      expect(service.findAllForUser).toHaveBeenCalledWith(5, paginationDto);
      expect(result).toEqual(expected);
    });
  });

  describe("markRead", () => {
    it("should call service.markRead with the notification id and current user's id", async () => {
      const req = { user: { id: 5 } } as any;
      const expected = { id: 1, read: true };
      mockNotificationsService.markRead.mockResolvedValue(expected);

      const result = await controller.markRead(req, "1");

      expect(service.markRead).toHaveBeenCalledWith(1, 5);
      expect(result).toEqual(expected);
    });
  });

  describe("markAllRead", () => {
    it("should call service.markAllRead with the current user's id", async () => {
      const req = { user: { id: 5 } } as any;
      mockNotificationsService.markAllRead.mockResolvedValue({ count: 2 });

      const result = await controller.markAllRead(req);

      expect(service.markAllRead).toHaveBeenCalledWith(5);
      expect(result).toEqual({ count: 2 });
    });
  });
});
