import { PartyworksEvents, PartyworksParse } from "partyworks-shared";
import WebSocket, { WebSocketServer } from "ws";
import { createClient } from "../../client";

//!note this is a temporary setup, proper testing will be added soon

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

describe("test throttling & batching", () => {
  it("should throttle the messages", (done) => {
    //window & WebSocket is needed for partyworks-client
    (global as any).WebSocket = WebSocket;
    (global as any).window = new MockWindow();
    const PORT = 9001; //https://www.youtube.com/watch?v=SiMHTK15Pik

    const socketServer = new WebSocketServer({ port: PORT });

    //number of events that we recieved on server /or num of events sent by the client one & the same thing
    let eventsRecivedCount = 0;
    socketServer.on("connection", (con) => {
      //fake room_state connect message
      con.send(
        JSON.stringify({
          event: PartyworksEvents.ROOM_STATE,
          data: {
            self: {
              data: {
                id: "hi",
              },
            },
            users: [],
          },
          _pwf: "-1",
        })
      );
      con.addEventListener("message", (message) => {
        const parsedEvent = PartyworksParse(message.data as string);

        expect(parsedEvent._pwf).toBe("-1");
        expect(parsedEvent.event).toBe(PartyworksEvents.BATCH);
        expect(parsedEvent.data.length).toBe(1);
        expect(parsedEvent.data[0].event).toBe(
          PartyworksEvents.PRESENSE_UPDATE
        );

        eventsRecivedCount++;
      });
    });

    //SHOULD THROTTLE TO ONE MESSAGE PER SECOND
    const client = createClient({
      host: `localhost:${PORT}`,
      throttle: 1000, //throttle per 1 second
      //   logLevel: 0,
    });

    const room = client.enter("partyworks");

    let connectedCount = 0;

    const intervalCount = 100; // Define the interval count
    const updateLimit = 5000; // Define the update time limit

    room.subscribe("status", (status) => {
      //connected should not be called more than once, for the entire duration of this test case
      if (status === "connected") {
        let time = 0;
        connectedCount++;

        if (connectedCount >= 2) {
          done({ error: "bad bad bad / should never happen" });
        }

        //try to update presence 500 times
        const updateInterval = setInterval(() => {
          if (time >= updateLimit) {
            clearInterval(updateInterval);
            //we send 5 events in total
            expect(eventsRecivedCount).toBe(5);

            room.disConnect();
            socketServer.close(() => {
              setTimeout(done, 100);
            });

            return;
          }

          room.updatePresence({ cursor: { x: time, y: time } });

          time += intervalCount;
        }, intervalCount);
      }
    });

    //LONG RUNNING TEST CAN TAKE UPTO 10 SEC
  }, 20000);

  //TODO
  it.todo("should not send message when not connected");
  it.todo("should send buffered message on reconnection");
  it.todo("should batch messages");
  it.todo("should not batch messages by default");
  it.todo("should work after reconnection");
});
