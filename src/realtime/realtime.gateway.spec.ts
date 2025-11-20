import { Test, TestingModule } from "@nestjs/testing";
import { RealtimeGateway } from "./realtime.gateway";
import { RealtimeService } from "./realtime.service";
import { CreateAppointmentSocketDto } from "./dto";
import { Server, Socket } from "socket.io";

describe("RealtimeGateway", () => {
  let gateway: RealtimeGateway;
  let service: RealtimeService;

  const mockRealtimeService = {
    create: jest.fn(),
    findAll: jest.fn(),
    updateStatusInProgress: jest.fn(),
    updateStatusCompleted: jest.fn(),
    remove: jest.fn(),
  };

  // Mock del servidor WebSocket (this.server)
  const mockServer = {
    emit: jest.fn(),
  };

  // Mock del socket cliente (client)
  const mockSocket = {
    emit: jest.fn(),
    id: "mock-client-id",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RealtimeGateway, { provide: RealtimeService, useValue: mockRealtimeService }],
    }).compile();

    gateway = module.get<RealtimeGateway>(RealtimeGateway);
    service = module.get<RealtimeService>(RealtimeService);

    // Asignamos el mock del servidor a la propiedad del gateway
    gateway.server = mockServer as unknown as Server;

    // Silenciar el logger para no ensuciar la consola
    jest.spyOn(gateway["logger"], "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(gateway).toBeDefined();
  });

  describe("handleConnection", () => {
    it("should log connection", () => {
      const spy = jest.spyOn(gateway["logger"], "log");
      gateway.handleConnection(mockSocket);
      expect(spy).toHaveBeenCalledWith("Client connected", mockSocket.id);
    });
  });

  describe("handleDisconnect", () => {
    it("should log disconnection", () => {
      const spy = jest.spyOn(gateway["logger"], "log");
      gateway.handleDisconnect(mockSocket);
      expect(spy).toHaveBeenCalledWith("Client disconnected", mockSocket.id);
    });
  });

  describe("create", () => {
    it("should create appointment and emit event", async () => {
      const dto: CreateAppointmentSocketDto = { patientsId: 1, doctorId: 2 } as any;
      const created = { id: 1, ...dto };

      mockRealtimeService.create.mockResolvedValue(created);

      const result = await gateway.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      // Verifica que emita a todos los clientes
      expect(mockServer.emit).toHaveBeenCalledWith("createdAppointments", created);
      expect(result).toEqual(created);
    });
  });

  describe("findAll", () => {
    it("should return all appointments and emit to specific socket", async () => {
      const appointments = [{ id: 1 }];
      mockRealtimeService.findAll.mockResolvedValue(appointments);

      const result = await gateway.findAll(mockSocket as unknown as Socket);

      expect(service.findAll).toHaveBeenCalled();
      // Verifica que emita solo al socket que lo pidió
      expect(mockSocket.emit).toHaveBeenCalledWith("getAppointments", appointments);
      expect(result).toEqual(appointments);
    });
  });

  describe("updateStatusInProgress", () => {
    it("should update status and emit event", async () => {
      const id = 1;
      const updated = { id, status: "IN_PROGRESS" };
      mockRealtimeService.updateStatusInProgress.mockResolvedValue(updated);

      const result = await gateway.updateStatusInProgress(id);

      expect(mockServer.emit).toHaveBeenCalledWith("updatedAppointmentStatusInProgress", id);
      expect(service.updateStatusInProgress).toHaveBeenCalledWith(id);
      expect(result).toEqual(updated);
    });
  });

  describe("updateStatusCompleted", () => {
    it("should update status and emit event", async () => {
      const id = 1;
      const updated = { id, status: "COMPLETED" };
      mockRealtimeService.updateStatusCompleted.mockResolvedValue(updated);

      const result = await gateway.updateStatusCompleted(id);

      expect(mockServer.emit).toHaveBeenCalledWith("updatedAppointmentStatusCompleted", id);
      expect(service.updateStatusCompleted).toHaveBeenCalledWith(id);
      expect(result).toEqual(updated);
    });
  });

  describe("remove", () => {
    it("should remove appointment and emit event", async () => {
      const id = 1;
      const response = { message: "Deleted", deletedRealtime: { id } };
      mockRealtimeService.remove.mockResolvedValue(response);

      const result = await gateway.remove(id);

      expect(mockServer.emit).toHaveBeenCalledWith("deletedAppointment", id);
      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(response);
    });
  });
});
