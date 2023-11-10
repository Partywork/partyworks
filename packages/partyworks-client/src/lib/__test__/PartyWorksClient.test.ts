import { PartyworksEvents } from "partyworks-shared";
import { createClient } from "../../client";
import { PORT, fakeServer } from "./_setup";

const SOCKET_URL = `localhost:${PORT}`;

describe("test throttling & batching", () => {
  it("should throttle the messages", (done) => {
    //number of events that we recieved on server /or num of events sent by the client one & the same thing
    let eventsRecivedCount = 0;

    //fake websocket server setup to listen for the messages
    fakeServer.setOnMessageCallback((_socket, parsedEvent) => {
      expect(parsedEvent._pwf).toBe("-1");
      expect(parsedEvent.event).toBe(PartyworksEvents.BATCH);
      expect(parsedEvent.data.length).toBe(1);
      expect(parsedEvent.data[0].event).toBe(PartyworksEvents.PRESENSE_UPDATE);

      console.log(parsedEvent.data[0].data);
      eventsRecivedCount++;
    });

    //SHOULD THROTTLE TO ONE MESSAGE PER SECOND
    const client = createClient({
      host: SOCKET_URL,
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
            done();

            return;
          }

          room.updatePresence({ cursor: { x: time, y: time } });

          time += intervalCount;
        }, intervalCount);
      }
    });

    //LONG RUNNING TEST WILL TAKE UPTO 5+ SEC
  }, 10000);

  it("[current] should queue & send buffered message on reconnection", (done) => {
    //fake websocket server setup to listen for the messages
    fakeServer.setOnMessageCallback((_socket, parsedEvent) => {
      expect(parsedEvent._pwf).toBe("-1");
      expect(parsedEvent.event).toBe(PartyworksEvents.BATCH);
      expect(parsedEvent.data.length).toBe(8);
      expect(parsedEvent.data[0].event).toBe(PartyworksEvents.PRESENSE_UPDATE);

      expect(parsedEvent.data[0].data.data.cursor).toStrictEqual({
        x: 2,
        y: 1,
      });

      expect(
        [
          ...parsedEvent.data.filter(
            (event: any) => event.event === PartyworksEvents.BROADCAST
          ),
        ].length
      ).toBe(4);

      expect(
        [
          ...parsedEvent.data.filter(
            (event: any) => event.event === "current-anime"
          ),
        ].length
      ).toBe(3);

      room.disConnect();
      done();
    });

    //SHOULD THROTTLE TO ONE MESSAGE PER SECOND
    const client = createClient({
      host: SOCKET_URL,
      throttle: 1000, //throttle per 1 second
      shouldQueueBroadcastIfNotReady: true,
      shouldQueueEventsIfNotReady: true,
      // logLevel: 0,
    });

    //enter the room
    const room = client.enter("partyworks");

    let didDisconnect = false;

    //todo for now we have to subscribe to this guy here, we need to make sure that presence is available even without self, maybe as a initialstate measure
    room.subscribe("self", (_self) => {
      if (!didDisconnect) {
        //close the connection
        didDisconnect = true;
        room.disConnect();

        //update the presence multiple times
        //and ensure send ihe message sar esent upon reconnection
        room.updatePresence({ cursor: { x: 1, y: 1 } });
        room.updatePresence({ cursor: { x: 2 } });
        room.broadcast({ webtoon: "lookism [go read]" });
        room.broadcast({ webtoon: "eleceed [go read]" });
        room.broadcast({ webtoon: "manager kim [go read]" });
        room.broadcast({ webtoon: "lone necromancer [go watch]" });
        room.emit("current-anime", { data: "urusei yatsura" });
        room.emit("current-anime", { data: "doctor stone season 3 part 2" });
        room.emit("current-anime", { data: "kage no jitsuryokusha season 2" });
        room.connect();
      }
    });
  });

  //only presence is saved by default, even if the connection is in not connected state
  it("[current] should not queue & buffer by default", (done) => {
    //fake websocket server setup to listen for the messages
    fakeServer.setOnMessageCallback((_socket, parsedEvent) => {
      expect(parsedEvent._pwf).toBe("-1");
      expect(parsedEvent.event).toBe(PartyworksEvents.BATCH);
      expect(parsedEvent.data.length).toBe(1);
      expect(parsedEvent.data[0].event).toBe(PartyworksEvents.PRESENSE_UPDATE);

      room.disConnect();
      done();
    });

    //SHOULD THROTTLE TO ONE MESSAGE PER SECOND
    const client = createClient({
      host: SOCKET_URL,
      throttle: 1000, //throttle per 1 second
      // logLevel: 0,
    });

    //enter the room
    const room = client.enter("partyworks");

    let didDisconnect = false;

    //todo for now we have to subscribe to this guy here, we need to make sure that presence is available even without self, maybe as a initialstate measure
    room.subscribe("self", (self) => {
      if (!didDisconnect) {
        //close the connection
        didDisconnect = true;
        room.disConnect();

        //update the presence multiple times
        //and ensure send ihe message sar esent upon reconnection
        room.updatePresence({ cursor: { x: 1, y: 1 } });
        room.updatePresence({ cursor: { x: 2 } });
        room.broadcast({ webtoon: "lookism [go read]" });
        room.broadcast({ webtoon: "eleceed [go read]" });
        room.broadcast({ webtoon: "manager kim [go read]" });
        room.broadcast({ webtoon: "lone necromancer [go watch]" });
        room.emit("current-anime", { data: "urusei yatsura" });
        room.emit("current-anime", { data: "doctor stone season 3 part 2" });
        room.emit("current-anime", { data: "kage no jitsuryokusha season 2" });

        room.connect();
      }
    });
  });

  it("[current] should respect OfflineOptions room.broadcast room.emit", (done) => {
    //fake websocket server setup to listen for the messages
    fakeServer.setOnMessageCallback((_socket, parsedEvent) => {
      expect(parsedEvent._pwf).toBe("-1");
      expect(parsedEvent.event).toBe(PartyworksEvents.BATCH);
      expect(parsedEvent.data.length).toBe(4);
      expect(parsedEvent.data[0].event).toBe(PartyworksEvents.PRESENSE_UPDATE);

      expect(
        [
          ...parsedEvent.data.filter(
            (event: any) => event.event === PartyworksEvents.BROADCAST
          ),
        ].length
      ).toBe(2);

      expect(
        [
          ...parsedEvent.data.filter(
            (event: any) => event.event === "current-anime"
          ),
        ].length
      ).toBe(1);

      room.disConnect();
      done();
    });

    //SHOULD THROTTLE TO ONE MESSAGE PER SECOND
    const client = createClient({
      host: SOCKET_URL,
      throttle: 1000, //throttle per 1 second
      // logLevel: 0,
    });

    //enter the room
    const room = client.enter("partyworks");

    let didDisconnect = false;

    //todo for now we have to subscribe to this guy here, we need to make sure that presence is available even without self, maybe as a initialstate measure
    room.subscribe("self", (self) => {
      if (!didDisconnect) {
        //close the connection
        didDisconnect = true;
        room.disConnect();

        //update the presence multiple times
        //and ensure send ihe message sar esent upon reconnection
        room.updatePresence({ cursor: { x: 1, y: 1 } });
        room.broadcast(
          { webtoon: "lookism [go read]" },
          { shouldQueueIfNotReady: true }
        );
        room.broadcast(
          { webtoon: "eleceed [go read]" },
          { shouldQueueIfNotReady: true }
        );
        room.broadcast({ webtoon: "manager kim [go read]" });
        room.broadcast({ webtoon: "lone necromancer [go watch]" });

        room.emit("current-anime", { data: "urusei yatsura" });
        room.emit(
          "current-anime",
          { data: "doctor stone season 3 part 2" },
          { shouldQueueIfNotReady: true }
        );
        room.emit("current-anime", { data: "kage no jitsuryokusha season 2" });

        room.connect();
      }
    });
  });
});
