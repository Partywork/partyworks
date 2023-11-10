import http from "http";
import {
  PartyworksEvents,
  PartyworksStringify,
  PartyworksParse,
} from "partyworks-shared";
import { WebSocketServer, WebSocket } from "ws";

interface BeforeConnectionCallback {
  (req: http.IncomingMessage): void | Promise<void>;
}

interface InitialStateCallback {
  (socket: WebSocket, req: http.IncomingMessage): void | Promise<void>;
}

interface EventCallback {
  (socket: WebSocket, parsedEvent: any): void;
}

interface InitialStateCallback {
  (socket: WebSocket): void;
}

//TODO WIP - this is a wip implementation of a flexible fakeServer

export class FakeServer {
  private httpServer: http.Server;
  private webSocketServer: WebSocketServer;
  private connections: WebSocket[] = [];
  private onBeforeConnectionCallback?: BeforeConnectionCallback;
  private initialStateCallback?: InitialStateCallback;
  private onConnectionCallback?: EventCallback;
  private onMessageCallback?: EventCallback;
  private onCloseCallback?: EventCallback;

  constructor(httpServer: http.Server, webSocketServer: WebSocketServer) {
    this.httpServer = httpServer;
    this.webSocketServer = webSocketServer;
    this.setup();
  }

  private setup() {
    this.webSocketServer.on("connection", (socket, req) => {
      this.connections.push(socket);
      this.sendInitialState(socket, req);
      if (this.onConnectionCallback) {
        this.onConnectionCallback(socket, null);
      }
      socket.addEventListener("message", (message) => {
        const parsedEvent = PartyworksParse(message.data as string);
        if (this.onMessageCallback) {
          this.onMessageCallback(socket, parsedEvent);
        }
      });
      socket.on("close", () => {
        if (this.onCloseCallback) {
          this.onCloseCallback(socket, null);
        }
      });

      //   socket.on("error", () => {

      //   })
    });
  }

  private sendInitialState(socket: WebSocket, req: http.IncomingMessage) {
    const searchParams = new URLSearchParams(req.url?.split("?")[1]);
    const initialState = {
      event: PartyworksEvents.ROOM_STATE,
      data: {
        self: {
          data: {
            id: searchParams.get("_pk"),
          },
        },
        users: [],
      },
      _pwf: "-1",
    };

    if (this.initialStateCallback) {
      this.initialStateCallback(socket, req);
    }

    socket.send(PartyworksStringify(initialState));
  }

  public setOnBeforeConnectionCallback(callback: BeforeConnectionCallback) {
    this.onBeforeConnectionCallback = callback;
  }

  public setOnConnectionCallback(callback: EventCallback) {
    this.onConnectionCallback = callback;
  }

  public setInitialStateCallback(callback: InitialStateCallback) {
    this.initialStateCallback = callback;
  }

  public setOnMessageCallback(callback: EventCallback) {
    this.onMessageCallback = callback;
  }

  public setOnCloseCallback(callback: EventCallback) {
    this.onCloseCallback = callback;
  }

  public closeConnections() {
    this.connections.forEach((socket) => socket.close());
  }

  public start() {
    this.httpServer.on("upgrade", async (request, socket, head) => {
      if (this.onBeforeConnectionCallback)
        await this.onBeforeConnectionCallback(request);

      this.webSocketServer.handleUpgrade(request, socket, head, (ws) => {
        this.webSocketServer.emit("connection", ws, request);
      });
    });
  }
}
