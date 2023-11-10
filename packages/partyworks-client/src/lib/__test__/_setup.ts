import http, { createServer } from "http";
import Websocket, { WebSocketServer } from "ws";
import { FakeServer } from "./_fakeServer";
import { MockWindow } from "./_MockWindow";

export const PORT = 9001; //https://www.youtube.com/watch?v=SiMHTK15Pik
export let fakeServer: FakeServer;

export let globalWindow: MockWindow;
const originalWebSocket = global.WebSocket || Websocket;
let socketServer: WebSocketServer;
let httpServer: http.Server;

beforeEach(() => {
  const newWindow = new MockWindow();

  //window & WebSocket is needed for partyworks-client
  (global as any).WebSocket = originalWebSocket;
  (global as any).window = newWindow;

  globalWindow = newWindow;

  httpServer = createServer((req, res) => {});
  socketServer = new WebSocketServer({ noServer: true });
  fakeServer = new FakeServer(httpServer, socketServer);

  fakeServer.start();
  httpServer.listen(PORT, () => {});
});

afterEach((done) => {
  jest.resetAllMocks();

  httpServer.close(() => {
    socketServer.close(() => {
      setTimeout(done, 100);
    });
  });

  delete (global as any).WebSocket;
  delete (global as any).window;
  jest.useRealTimers();
});
