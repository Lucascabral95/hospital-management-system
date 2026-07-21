import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { NotificationsGateway } from "./notifications.gateway";
import { AccessTokenVerifier } from "src/auth/services/access-token-verifier.service";
import { Server, Socket } from "socket.io";

describe("NotificationsGateway", () => {
  let gateway: NotificationsGateway;
  let accessTokenVerifier: { verifyAccess: jest.Mock };

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  const buildSocket = (overrides: Partial<Socket> = {}) =>
    ({
      handshake: { auth: {}, headers: {} },
      data: {},
      join: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      ...overrides,
    }) as unknown as Socket;

  beforeEach(async () => {
    accessTokenVerifier = { verifyAccess: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsGateway, { provide: AccessTokenVerifier, useValue: accessTokenVerifier }],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    gateway.server = mockServer as unknown as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(gateway).toBeDefined();
  });

  describe("handleConnection", () => {
    it("should disconnect a client without a token", async () => {
      const client = buildSocket();

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(accessTokenVerifier.verifyAccess).not.toHaveBeenCalled();
    });

    it("should join the user room for a valid, active user", async () => {
      const client = buildSocket({ handshake: { auth: { token: "abc" }, headers: {} } as any });
      accessTokenVerifier.verifyAccess.mockResolvedValue({ id: 7 });

      await gateway.handleConnection(client);

      expect(client.join).toHaveBeenCalledWith("user:7");
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it("should disconnect when the token is invalid", async () => {
      const client = buildSocket({ handshake: { auth: { token: "bad" }, headers: {} } as any });
      accessTokenVerifier.verifyAccess.mockRejectedValue(new UnauthorizedException("Invalid or expired token"));

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
    });

    it("should disconnect when the user is inactive", async () => {
      const client = buildSocket({ handshake: { auth: { token: "abc" }, headers: {} } as any });
      accessTokenVerifier.verifyAccess.mockRejectedValue(
        new UnauthorizedException("User is inactive, talk with an admin"),
      );

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(client.join).not.toHaveBeenCalled();
    });

    it("should extract the token from the Authorization header when auth.token is absent", async () => {
      const client = buildSocket({
        handshake: { auth: {}, headers: { authorization: "Bearer xyz" } } as any,
      });
      accessTokenVerifier.verifyAccess.mockResolvedValue({ id: 3 });

      await gateway.handleConnection(client);

      expect(accessTokenVerifier.verifyAccess).toHaveBeenCalledWith("xyz");
      expect(client.join).toHaveBeenCalledWith("user:3");
    });
  });

  describe("emitToUser", () => {
    it("should emit the notification to the user's room", () => {
      const notification = { id: 1, title: "Hola" };

      gateway.emitToUser(9, notification);

      expect(mockServer.to).toHaveBeenCalledWith("user:9");
      expect(mockServer.emit).toHaveBeenCalledWith("notification", notification);
    });
  });
});
