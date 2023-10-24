import Websocket, { WebSocketServer } from "ws";

export const PORT = 4444;
const originalWebSocket = global.WebSocket || Websocket;
export let socketServer: WebSocketServer;
export let globalWindow: MockWindow;

class MockWindow {
  _listeners: { [event: string]: (() => void)[] } = {};

  addEventListener(event: "focus" | "offline", handler: () => void) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(handler);
  }

  notify(event: "focus" | "offline") {
    const listeners = this._listeners[event];
    if (listeners) {
      listeners.forEach((handler) => {
        handler();
      });
    }
  }

  //dummy
  removeEventListener(event: "focus" | "offline", handler: () => void) {}
}

beforeEach(() => {
  const newWindow = new MockWindow();

  (global as any).WebSocket = originalWebSocket;
  (global as any).window = newWindow;

  globalWindow = newWindow;
  socketServer = new WebSocketServer({ port: PORT });
});
afterEach((done) => {
  jest.resetAllMocks();
  socketServer.close(() => {
    setTimeout(done, 100);
  });
  delete (global as any).WebSocket;
  delete (global as any).window;
  jest.useRealTimers();
});
