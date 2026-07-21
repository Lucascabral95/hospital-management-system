import { Test, TestingModule } from "@nestjs/testing";
import { NotificationsService } from "./notifications.service";
import { NotificationsGateway } from "./notifications.gateway";
import { PrismaService } from "src/prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

describe("NotificationsService", () => {
  let service: NotificationsService;

  const mockGateway = {
    emitToUser: jest.fn(),
  };

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    doctor: {
      findUnique: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationsGateway, useValue: mockGateway },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("notify", () => {
    it("should persist the notification and emit it to the recipient", async () => {
      const input = {
        recipientAuthId: 1,
        type: "APPOINTMENT",
        title: "Nuevo turno",
        body: "Detalle",
      };
      const created = { id: 1, ...input, read: false, createdAt: new Date() };
      mockPrismaService.notification.create.mockResolvedValue(created);

      const result = await service.notify(input);

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({ data: input });
      expect(mockGateway.emitToUser).toHaveBeenCalledWith(1, created);
      expect(result).toEqual(created);
    });
  });

  describe("findAllForUser", () => {
    it("should return paginated notifications with unread count", async () => {
      const notifications = [{ id: 1, read: false }];
      mockPrismaService.notification.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2);
      mockPrismaService.notification.findMany.mockResolvedValue(notifications);

      const result = await service.findAllForUser(1, { page: 1, limit: 10 } as any);

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { recipientAuthId: 1 }, skip: 0, take: 10 }),
      );
      expect(result).toEqual({
        totalPage: 1,
        page: 1,
        total: 5,
        unreadCount: 2,
        data: notifications,
      });
    });
  });

  describe("markRead", () => {
    it("should mark a notification as read for its owner", async () => {
      const updated = { id: 1, read: true };
      mockPrismaService.notification.update.mockResolvedValue(updated);

      const result = await service.markRead(1, 5);

      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { id: 1, recipientAuthId: 5 },
        data: { read: true },
      });
      expect(result).toEqual(updated);
    });

    it("should throw NotFoundException when the notification does not belong to the user (P2025)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });
      mockPrismaService.notification.update.mockRejectedValue(prismaError);

      await expect(service.markRead(999, 5)).rejects.toThrow(NotFoundException);
    });
  });

  describe("markAllRead", () => {
    it("should mark every unread notification for the user as read", async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.markAllRead(5);

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { recipientAuthId: 5, read: false },
        data: { read: true },
      });
      expect(result).toEqual({ count: 3 });
    });
  });

  describe("notifyDoctorOfAppointment", () => {
    it("should look up the doctor's authId and notify them", async () => {
      mockPrismaService.doctor.findUnique.mockResolvedValue({ authId: 42 });
      mockPrismaService.notification.create.mockResolvedValue({ id: 1 });

      await service.notifyDoctorOfAppointment(7, 100, "Título", "Cuerpo");

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientAuthId: 42,
          type: "APPOINTMENT",
          relatedType: "Appointment",
          relatedId: 100,
        }),
      });
      expect(mockGateway.emitToUser).toHaveBeenCalledWith(42, { id: 1 });
    });

    it("should return null when the doctor does not exist", async () => {
      mockPrismaService.doctor.findUnique.mockResolvedValue(null);

      const result = await service.notifyDoctorOfAppointment(999, 100, "Título", "Cuerpo");

      expect(result).toBeNull();
      expect(mockPrismaService.notification.create).not.toHaveBeenCalled();
    });
  });

  describe("sendUpcomingAppointmentReminders", () => {
    it("should skip appointments that were already reminded", async () => {
      mockPrismaService.appointment.findMany.mockResolvedValue([
        { id: 1, doctorId: 7, specialty: "Cardiology", scheduledAt: new Date() },
      ]);
      mockPrismaService.notification.findFirst.mockResolvedValue({ id: 5 });

      await service.sendUpcomingAppointmentReminders();

      expect(mockPrismaService.doctor.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaService.notification.create).not.toHaveBeenCalled();
    });

    it("should notify the doctor once for a new upcoming appointment", async () => {
      mockPrismaService.appointment.findMany.mockResolvedValue([
        { id: 1, doctorId: 7, specialty: "Cardiology", scheduledAt: new Date() },
      ]);
      mockPrismaService.notification.findFirst.mockResolvedValue(null);
      mockPrismaService.doctor.findUnique.mockResolvedValue({ authId: 42 });
      mockPrismaService.notification.create.mockResolvedValue({ id: 2 });

      await service.sendUpcomingAppointmentReminders();

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientAuthId: 42,
          type: "APPOINTMENT_REMINDER",
          relatedType: "APPOINTMENT_REMINDER",
          relatedId: 1,
        }),
      });
    });
  });
});
