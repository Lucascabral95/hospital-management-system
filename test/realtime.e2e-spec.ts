import { INestApplication } from "@nestjs/common";
import { io, Socket } from "socket.io-client";
import { createTestApp } from "./utils/create-test-app";
import { seedDatabase, SEED_USERS } from "./utils/seed";
import { loginAs, signExpiredAccess, signRefreshShapedToken } from "./utils/auth";

function connectSocket(url: string, opts: Parameters<typeof io>[1] = {}): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(url, { transports: ["websocket"], forceNew: true, ...opts });
    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", (err) => reject(err));
  });
}

function waitForEvent<T = unknown>(socket: Socket, event: string, timeoutMs = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for "${event}"`)), timeoutMs);
    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

describe("Realtime gateway (e2e)", () => {
  let app: INestApplication;
  let baseUrl: string;
  let accessToken: string;
  const sockets: Socket[] = [];

  const track = (socket: Socket): Socket => {
    sockets.push(socket);
    return socket;
  };

  beforeAll(async () => {
    app = await createTestApp();
    await seedDatabase(app);
    await app.listen(0);

    const url = await app.getUrl();
    // app.getUrl() puede devolver [::1] o 0.0.0.0 según la plataforma; socket.io-client necesita un host real.
    baseUrl = url.replace("[::1]", "127.0.0.1").replace("0.0.0.0", "127.0.0.1");

    const admin = await loginAs(app, SEED_USERS.admin.email, SEED_USERS.admin.password);
    accessToken = admin.accessToken;
  });

  afterEach(() => {
    while (sockets.length) {
      sockets.pop()?.close();
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it("createAppointment is public on purpose and broadcasts createdAppointments", async () => {
    const socket = track(await connectSocket(baseUrl));

    const eventPromise = waitForEvent<{ patientsId: number }>(socket, "createdAppointments");
    socket.emit("createAppointment", { patientsId: 1 });

    const created = await eventPromise;
    expect(created).toEqual(expect.objectContaining({ patientsId: 1 }));
  });

  it("rejects getAppointments without a token", async () => {
    const socket = track(await connectSocket(baseUrl));

    const errorPromise = waitForEvent(socket, "exception");
    socket.emit("getAppointments");

    const error = await errorPromise;
    expect(JSON.stringify(error)).toMatch(/token/i);
  });

  it("allows getAppointments with a valid access token", async () => {
    const socket = track(await connectSocket(baseUrl, { auth: { token: accessToken } }));

    const resultPromise = waitForEvent<unknown[]>(socket, "getAppointments");
    socket.emit("getAppointments");

    const result = await resultPromise;
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects getAppointments with an expired access token", async () => {
    const expired = signExpiredAccess(app, { id: 1, full_name: "x", email: "x", role: "ADMIN", is_active: true });
    const socket = track(await connectSocket(baseUrl, { auth: { token: expired } }));

    const errorPromise = waitForEvent(socket, "exception");
    socket.emit("getAppointments");

    await expect(errorPromise).resolves.toBeDefined();
  });

  it("rejects getAppointments with a refresh-shaped token", async () => {
    const refreshShaped = signRefreshShapedToken(1);
    const socket = track(await connectSocket(baseUrl, { auth: { token: refreshShaped } }));

    const errorPromise = waitForEvent(socket, "exception");
    socket.emit("getAppointments");

    await expect(errorPromise).resolves.toBeDefined();
  });

  describe("/notifications namespace", () => {
    it("disconnects a client without a token", async () => {
      const socket = io(`${baseUrl}/notifications`, { transports: ["websocket"], forceNew: true });
      const disconnectPromise = waitForEvent(socket, "disconnect");

      await disconnectPromise;
      socket.close();
    });

    it("accepts a client with a valid token", async () => {
      const socket = track(await connectSocket(`${baseUrl}/notifications`, { auth: { token: accessToken } }));

      expect(socket.connected).toBe(true);
    });
  });
});
