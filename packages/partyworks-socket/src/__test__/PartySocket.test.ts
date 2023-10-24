import { PartySocket, StopRetry } from "../PartySocket";
import { PORT, globalWindow, socketServer } from "./_setup";

const SOCKET_URL = `localhost:${PORT}`;

const expectInternals = (
  partySocket: PartySocket,
  {
    stateBlock,
    counter,
    getStatus,
  }: Partial<{ stateBlock: string; counter: number; getStatus: string }>
) => {
  if (typeof counter === "number") {
    //@ts-ignore -- accesing private prop
    expect(partySocket.counter).toBe(counter);
  }

  if (stateBlock) {
    //@ts-ignore -- accesing private prop
    expect(partySocket.stateBlock).toBe("initial");
  }

  if (getStatus) {
    expect(partySocket.getStatus()).toBe(getStatus);
  }
};

it("should run the test", () => {
  expect([...socketServer.clients.values()].length).toBe(0);
});

it("initialize partysocket", () => {
  const socket = new PartySocket({ host: "", room: "BOB" });

  expectInternals(socket, {
    counter: 0,
    stateBlock: "initial",
    getStatus: "initial",
  });
});

it("should not be able to call  close  if not started", () => {
  const socket = new PartySocket({ host: "", room: "BOB" });

  const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

  socket.close();

  expect(warnSpy.mock.calls.length).toBe(1);
  expect(
    warnSpy.mock.calls.every((call) =>
      call[0].includes("machine is not started")
    )
  ).toBe(true);

  socket.close();
  socket.close();
  socket.close();
  socket.close();

  expect(warnSpy.mock.calls.length).toBe(5);
  expect(
    warnSpy.mock.calls.every((call) =>
      call[0].includes("machine is not started")
    )
  ).toBe(true);

  expectInternals(socket, {
    counter: 0,
    stateBlock: "initial",
    getStatus: "initial",
  });

  warnSpy.mockRestore();
});

it("should not be able to call  reconnect  if not started", () => {
  const socket = new PartySocket({ host: "", room: "BOB" });

  const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

  socket.reconnect();

  expect(warnSpy.mock.calls.length).toBe(1);
  expect(
    warnSpy.mock.calls.every((call) =>
      call[0].includes("machine is not started")
    )
  ).toBe(true);

  socket.reconnect();
  socket.reconnect();
  socket.reconnect();
  socket.reconnect();

  expect(warnSpy.mock.calls.length).toBe(5);
  expect(
    warnSpy.mock.calls.every((call) =>
      call[0].includes("machine is not started")
    )
  ).toBe(true);

  expectInternals(socket, {
    counter: 0,
    stateBlock: "initial",
    getStatus: "initial",
  });

  warnSpy.mockRestore();
});

it("should not be able to call  stop  if not started", () => {
  const socket = new PartySocket({ host: "", room: "BOB" });

  const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

  socket.stop();

  expect(warnSpy.mock.calls.length).toBe(1);
  expect(
    warnSpy.mock.calls.every((call) =>
      call[0].includes("machine is not started")
    )
  ).toBe(true);

  socket.stop();
  socket.stop();
  socket.stop();
  socket.stop();

  expect(warnSpy.mock.calls.length).toBe(5);
  expect(
    warnSpy.mock.calls.every((call) =>
      call[0].includes("machine is not started")
    )
  ).toBe(true);

  expectInternals(socket, {
    counter: 0,
    stateBlock: "initial",
    getStatus: "initial",
  });

  warnSpy.mockRestore();
});

it("should work as expected on bad auth", (done) => {
  const socket = new PartySocket({
    host: "",
    room: "BOB",
    config: { maxAuthTries: 3, maxConnTries: 3 },
    auth: () => {
      throw new Error("bad bad bad");
    },
  });

  //@ts-ignore -- private prop
  const authSpy = jest.spyOn(socket, "authentication");

  //@ts-ignore -- private prop
  const authErrSpy = jest.spyOn(socket, "authError");

  //@ts-ignore -- private prop
  const conSpy = jest.spyOn(socket, "connection");

  socket.eventHub.status.subscribe((status) => {
    if (status === "failed") {
      //+1 for the initial start
      expect(authSpy).toHaveBeenCalledTimes(4);
      expect(authErrSpy).toHaveBeenCalledTimes(4);
      expect(conSpy).toBeCalledTimes(0);
      expectInternals(socket, { counter: 0 });
      done();
    }
  });

  socket.start();
});

it("should stop retry auth, on known StopRetry error", (done) => {
  const socket = new PartySocket({
    host: "",
    room: "BOB",
    config: { maxAuthTries: 3, maxConnTries: 3 },
    auth: () => {
      throw new StopRetry("i need a job ><");
    },
  });

  //@ts-ignore -- private prop
  const authSpy = jest.spyOn(socket, "authentication");

  //@ts-ignore -- private prop
  const authErrSpy = jest.spyOn(socket, "authError");

  //@ts-ignore -- private prop
  const conSpy = jest.spyOn(socket, "connection");

  socket.eventHub.status.subscribe((status) => {
    if (status === "failed") {
      //+1 for the initial start
      expect(authSpy).toHaveBeenCalledTimes(1);
      expect(authErrSpy).toHaveBeenCalledTimes(1);
      expect(conSpy).toBeCalledTimes(0);
      expectInternals(socket, { counter: 0 });
      done();
    }
  });

  socket.start();
});

it("should handle authtimeout correctly", (done) => {
  const socket = new PartySocket({
    host: "",
    room: "BOB",
    config: { maxAuthTries: 3, maxConnTries: 3, authTimeout: 0 },
    auth: async () => {
      return new Promise<void>((res) => {
        setTimeout(() => {
          res();
        }, 200);
      });
    },
  });

  //@ts-ignore -- private prop
  const authSpy = jest.spyOn(socket, "authentication");
  //@ts-ignore -- private prop
  const authErrSpy = jest.spyOn(socket, "authError");
  //@ts-ignore -- private prop
  const conSpy = jest.spyOn(socket, "connection");

  socket.eventHub.status.subscribe((conn) => {
    if (conn === "failed") {
      //+1 from start()
      expect(authSpy).toHaveBeenCalledTimes(4);
      expect(authErrSpy).toBeCalledTimes(4);
      expect(conSpy).toBeCalledTimes(0);
      expectInternals(socket, { counter: 0 });
      done();
    }
  });

  socket.start();
});

//todo maybe throw an error on bad url
it("should not be able to connect on bad host", (done) => {
  const socket = new PartySocket({
    host: "",
    room: "BOB",
    config: { maxConnTries: 2, connectionBackoff: [0, 0, 0] },
    // logLevel: 0,
  });

  //@ts-ignore -- private prop
  expect(socket.options.config!.connectionBackoff).toStrictEqual([0, 0, 0]);

  //@ts-ignore -- private prop
  const authSpy = jest.spyOn(socket, "authentication");

  //@ts-ignore -- private prop
  const conSpy = jest.spyOn(socket, "connection");

  //@ts-ignore -- private prop
  const conErrSpy = jest.spyOn(socket, "connectionError");

  socket.eventHub.status.subscribe((conn) => {
    if (conn === "failed") {
      //+1 for the initial start
      expect(authSpy).toHaveBeenCalledTimes(3);
      expect(conSpy).toBeCalledTimes(3);
      expect(conErrSpy).toBeCalledTimes(3);
      expectInternals(socket, { counter: 0 });
      done();
    }
  });

  socket.start();
}, 10000);

it("should connect", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    config: { maxConnTries: 3 },
    // logLevel: 0,
  });

  //@ts-ignore -- private prop
  const authSpy = jest.spyOn(socket, "authentication");

  //@ts-ignore -- private prop
  const authErrSpy = jest.spyOn(socket, "authError");

  //@ts-ignore -- private prop
  const conSpy = jest.spyOn(socket, "connection");

  //@ts-ignore -- private prop
  const conErrSpy = jest.spyOn(socket, "connectionError");

  socket.eventHub.status.subscribe((conn) => {
    if (conn === "connected") {
      //+1 for the initial start
      expect(authSpy).toHaveBeenCalledTimes(1);
      expect(authErrSpy).toBeCalledTimes(0);
      expect(conSpy).toBeCalledTimes(1);
      expect(conErrSpy).toBeCalledTimes(0);
      expectInternals(socket, { counter: 0 });

      socket.stop();
      done();
    }
  });

  socket.start();
});

it("should connect and recieve message", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    config: { maxConnTries: 3 },
    // logLevel: 0,
  });

  socketServer.once("connection", (con) => {
    con.send("Hey hey hey!");
  });

  socket.eventHub.messages.subscribe((e) => {
    if (e.data === "Hey hey hey!") {
      socket.stop();
      done();
    }
  });

  socket.start();
});

it("should not use connectionResolver without waitForRoom", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    config: { maxConnTries: 3 },
    connectionResolver(message, resolver) {
      throw new StopRetry("bad bad bad");
    },
    // logLevel: 0,
  });

  socketServer.once("connection", (con) => {
    con.send("Hey hey hey!");
  });

  socket.eventHub.status.subscribe((conn) => {
    if (conn === "connected") {
      expect([...socketServer.clients.values()].length).toBe(1);

      socket.stop();

      done();
    }
  });

  socket.start();
});

it("should handle connectionResolver", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    config: { maxConnTries: 3 },
    waitForRoom: true,
    connectionResolver(message, resolver) {
      if (message.data === "Hey hey hey!") {
        resolver();
      }
    },
    // logLevel: 0,
  });

  socketServer.once("connection", (con) => {
    con.send("Hey hey hey!");
  });

  socket.eventHub.status.subscribe((conn) => {
    if (conn === "connected") {
      expect([...socketServer.clients.values()].length).toBe(1);

      socket.stop();

      done();
    }
  });

  socket.start();
});

it("should handle bad connectionResolver", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    config: { maxConnTries: 3, socketConnectTimeout: 500 },
    waitForRoom: true,

    //in case the timeout occurs first, neither the resolve or rejecter would do anything just noop
    connectionResolver(message, resolver) {
      if (message.data === "you got the job!") {
        resolver();
      }
    },
    // logLevel: 0,
  });

  //@ts-ignore -- private prop
  const authSpy = jest.spyOn(socket, "authentication");

  //@ts-ignore -- private prop
  const authErrSpy = jest.spyOn(socket, "authError");

  //@ts-ignore -- private prop
  const conSpy = jest.spyOn(socket, "connection");

  //@ts-ignore -- private prop
  const conErrSpy = jest.spyOn(socket, "connectionError");

  //@ts-ignore -- private prop
  const closeSocketSpy = jest.spyOn(socket, "closeSocket");

  socketServer.once("connection", (con) => {
    con.send("You don't get a job!");
  });

  socket.eventHub.status.subscribe((conn) => {
    if (conn === "connected") {
      done("should never happen");
    }

    if (conn === "failed") {
      //+1 for start
      expect(authSpy).toHaveBeenCalledTimes(4);
      expect(authErrSpy).toBeCalledTimes(0);
      expect(conSpy).toBeCalledTimes(4);
      expect(conErrSpy).toBeCalledTimes(4);

      expect(closeSocketSpy).toBeCalledTimes(0);

      socket.stop();

      done();
    }
  });

  socket.start();
});

it("should respect stopRetry error from connectionResolver", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    config: { maxConnTries: 3, socketConnectTimeout: 2000 },
    waitForRoom: true,
    connectionResolver(_message, _resolver, rejector) {
      rejector(
        new StopRetry(
          "STOP, get some help, watch haikyuu, new season coming soon, also dr stone's new season is crazy"
        )
      );
    },
    // logLevel: 0,
  });

  //@ts-ignore -- private prop
  const authSpy = jest.spyOn(socket, "authentication");

  //@ts-ignore -- private prop
  const authErrSpy = jest.spyOn(socket, "authError");

  //@ts-ignore -- private prop
  const conSpy = jest.spyOn(socket, "connection");

  //@ts-ignore -- private prop
  const conErrSpy = jest.spyOn(socket, "connectionError");

  //@ts-ignore -- private prop
  const closeSocketSpy = jest.spyOn(socket, "closeSocket");

  socketServer.once("connection", (con) => {
    con.send("You don't get a job!");
  });

  socket.eventHub.status.subscribe((conn) => {
    if (conn === "connected") {
      done("should never happen");
    }

    if (conn === "failed") {
      //+1 for start
      expect(authSpy).toHaveBeenCalledTimes(1);
      expect(authErrSpy).toBeCalledTimes(0);
      expect(conSpy).toBeCalledTimes(1);
      expect(conErrSpy).toBeCalledTimes(1);

      expect(closeSocketSpy).toBeCalledTimes(0);

      socket.stop();

      done();
    }
  });

  socket.start();
});

it("should reconnect", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    config: { maxConnTries: 3, connectionBackoff: [0, 0, 0] },
    // logLevel: 0,
  });

  let didReconnect = false;

  //@ts-ignore -- private prop
  const authSpy = jest.spyOn(socket, "authentication");

  //@ts-ignore -- private prop
  const authErrSpy = jest.spyOn(socket, "authError");

  //@ts-ignore -- private prop
  const conSpy = jest.spyOn(socket, "connection");

  //@ts-ignore -- private prop
  const conErrSpy = jest.spyOn(socket, "connectionError");

  //@ts-ignore -- private prop
  const closeSocketSpy = jest.spyOn(socket, "closeSocket");

  socket.eventHub.status.subscribe((conn) => {
    if (conn === "connected") {
      //first connection
      if (!didReconnect) {
        expect([
          //@ts-ignore
          socket.counter,
          //@ts-ignore
          socket.stateBlock,
          socket.getStatus(),
        ]).toStrictEqual([0, "connected", "connected"]);

        expect(authSpy).toHaveBeenCalledTimes(1);
        expect(authErrSpy).toBeCalledTimes(0);
        expect(conSpy).toBeCalledTimes(1);
        expect(conErrSpy).toBeCalledTimes(0);

        expect(closeSocketSpy).toBeCalledTimes(0);

        expect([...socketServer.clients.values()].length).toBe(1);

        didReconnect = true;
        socket.reconnect();

        expect(closeSocketSpy).toBeCalledTimes(1);

        return;
      }

      expect(closeSocketSpy).toBeCalledTimes(1);

      //second connection after reconnect
      expect([
        //@ts-ignore
        socket.counter,
        //@ts-ignore
        socket.stateBlock,
        socket.getStatus(),
      ]).toStrictEqual([1, "connected", "connected"]);

      expect(authSpy).toHaveBeenCalledTimes(2);
      expect(authErrSpy).toBeCalledTimes(0);
      expect(conSpy).toBeCalledTimes(2);
      expect(conErrSpy).toBeCalledTimes(0);

      //server values are inconsisten :()
      //   expect([...socketServer.clients.values()].length).toBe(1);

      socket.stop();

      expect(closeSocketSpy).toBeCalledTimes(2);

      expect([
        //@ts-ignore
        socket.counter,
        //@ts-ignore
        socket.stateBlock,
        socket.getStatus(),
      ]).toStrictEqual([2, "initial", "closed"]);

      done();
    }
  });

  expect([...socketServer.clients.values()].length).toBe(0);
  socket.start();
});

it("should handle multiple reconnects", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    config: { maxConnTries: 3, connectionBackoff: [0, 0, 0] },
    // logLevel: 0,
  });

  socket.eventHub.status.subscribe((conn) => {
    //@ts-ignore ------ private prop, should never happen
    if (socket.counter > 6 && conn !== "initial") {
      done({ msg: "bad bad bad" });
    }

    //@ts-ignore ------ private prop
    if (conn === "connected" && socket.counter === 5) {
      setTimeout(() => {
        expect([...socketServer.clients.values()].length).toBe(1);
        socket.stop();
      }, 50);

      //give some time to close
      setTimeout(() => {
        expect([...socketServer.clients.values()].length).toBe(0);
        done();
      }, 100);
    }
  });

  socket.start();
  socket.reconnect();
  socket.reconnect();
  socket.reconnect();
  socket.reconnect();
  socket.reconnect();
});

it("should handle fuzzy(ish) reconnects", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    config: { maxConnTries: 3, connectionBackoff: [0, 0, 0] },
    // logLevel: 0,
  });

  let reconLimit = 5;

  socket.eventHub.status.subscribe((conn) => {
    if (
      ["initial", "auth", "connection"].some((substring) =>
        conn.includes(substring)
      ) &&
      reconLimit >= 1
    ) {
      if (Math.floor(Math.random() * 10) % 2 === 0) {
        reconLimit--;
        socket.reconnect();
      }

      return;
    }

    if (conn === "connected") {
      if (reconLimit >= 1) {
        reconLimit--;
        socket.reconnect();

        return;
      }

      //@ts-ignore private prop
      if (socket.counter === 5) {
        setTimeout(() => {
          expect([...socketServer.clients.values()].length).toBe(1);
          socket.stop();
        }, 100);

        //give some time to close
        setTimeout(() => {
          expect([...socketServer.clients.values()].length).toBe(0);
          done();
        }, 500);
      }
    }
  });

  socket.start();
});

it("should handle fuzzy(ish) reconnects with async auth", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    config: { maxConnTries: 3, connectionBackoff: [0, 0, 0] },
    auth: () => {
      return new Promise<void>((res, rej) => {
        setTimeout(() => {
          res();
        }, 100);
      });
    },
    // logLevel: 0,
  });

  let reconLimit = 5;

  socket.eventHub.status.subscribe((conn) => {
    if (
      ["initial", "auth", "connection"].some((substring) =>
        conn.includes(substring)
      ) &&
      reconLimit >= 1
    ) {
      if (Math.floor(Math.random() * 10) % 2 === 0) {
        reconLimit--;
        socket.reconnect();
      }

      return;
    }

    if (conn === "connected") {
      if (reconLimit >= 1) {
        reconLimit--;
        socket.reconnect();

        return;
      }

      //@ts-ignore private prop
      if (socket.counter === 5) {
        setTimeout(() => {
          expect([...socketServer.clients.values()].length).toBe(1);
          socket.stop();
        }, 10);

        //give some time to close
        setTimeout(() => {
          expect([...socketServer.clients.values()].length).toBe(0);
          done();
        }, 50);
      }
    }
  });

  socket.start();
});

it("should try to auto reconnect", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    config: { maxConnTries: 3, connectionBackoff: [0, 0, 0] },
    // logLevel: 0,
  });

  let reconTimes = 0;

  //@ts-ignore -- private prop
  const authSpy = jest.spyOn(socket, "authentication");

  //@ts-ignore -- private prop
  const conSpy = jest.spyOn(socket, "connection");

  //@ts-ignore -- private prop
  const conErrSpy = jest.spyOn(socket, "connectionError");

  //@ts-ignore -- private prop
  const closeSocketSpy = jest.spyOn(socket, "closeSocket");

  socketServer.on("connection", (con) => {
    con.close();
  });

  socket.eventHub.status.subscribe((conn) => {
    if (conn === "connected") {
      reconTimes++;
      if (reconTimes > 5) {
        //@ts-ignore -1 for start() counts as 0
        expect(socket.counter).toBe(reconTimes - 1);

        //+1 for the initial start
        expect(authSpy).toHaveBeenCalledTimes(reconTimes);
        expect(conSpy).toBeCalledTimes(reconTimes);
        expect(conErrSpy).toBeCalledTimes(0);

        // -1 since not yet closed on this one
        expect(closeSocketSpy).toBeCalledTimes(reconTimes - 1);

        socket.stop();

        done();
      }
    }
  });

  socket.start();
});

it("should not try to auto reconnect on known close code", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    config: { maxConnTries: 3, connectionBackoff: [0, 0, 0] },
    // logLevel: 0,
  });

  let reconTimes = 0;

  //@ts-ignore -- private prop
  const authSpy = jest.spyOn(socket, "authentication");

  //@ts-ignore -- private prop
  const conSpy = jest.spyOn(socket, "connection");

  //@ts-ignore -- private prop
  const conErrSpy = jest.spyOn(socket, "connectionError");

  //@ts-ignore -- private prop
  const closeSocketSpy = jest.spyOn(socket, "closeSocket");

  socketServer.on("connection", (con) => {
    con.close(4000);
  });

  socket.eventHub.status.subscribe((conn) => {
    if (conn === "connected") {
      reconTimes++;
    }

    if (
      (conn === "initial" && socket.getStatus() === "closed",
      closeSocketSpy.mock.calls.length === 1)
    ) {
      //@ts-ignore
      expect(socket.counter).toBe(reconTimes);

      //+1 for the initial start
      expect(authSpy).toHaveBeenCalledTimes(reconTimes);
      expect(conSpy).toBeCalledTimes(reconTimes);
      expect(conErrSpy).toBeCalledTimes(0);

      socket.stop();

      done();
    }
  });

  socket.start();
});

it(" should do ping/pong", (done) => {
  jest.useFakeTimers({ advanceTimers: true });

  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    config: { heartbeatInterval: 5000 },
    // logLevel: 0,
  });

  //@ts-ignore -- private prop
  const authSpy = jest.spyOn(socket, "authentication");

  //@ts-ignore -- private prop
  const conSpy = jest.spyOn(socket, "connection");

  //@ts-ignore -- private prop
  const conErrSpy = jest.spyOn(socket, "connectionError");

  //@ts-ignore -- private prop
  const connectedSpy = jest.spyOn(socket, "connected");

  //@ts-ignore -- private prop
  const pingSpy = jest.spyOn(socket, "ping");

  //@ts-ignore -- private prop
  const closeSocketSpy = jest.spyOn(socket, "closeSocket");

  socketServer.on("connection", (con) => {
    con.addEventListener("message", (e) => {
      if (e.data === "PING") {
        con.send("PONG");
      }
    });
  });

  socket.eventHub.status.subscribe((conn) => {
    if (conn === "connected") {
      setTimeout(() => {
        jest.advanceTimersByTime(5000);

        setTimeout(() => {
          expect(socket.getStatus()).toBe("connected");

          //From the ping
          expect(connectedSpy).toHaveBeenCalledTimes(2);

          //from connected
          expect(pingSpy).toHaveBeenCalledTimes(1);

          expect(authSpy).toHaveBeenCalledTimes(1);
          expect(conSpy).toBeCalledTimes(1);

          expect(conErrSpy).toBeCalledTimes(0);
          expect(closeSocketSpy).toBeCalledTimes(0);

          socket.stop();

          done();
        }, 100);

        // jest.advanceTimersByTime(2000);
      }, 10);
    }
  });

  socket.start();
});

it("should reconnnect on failed ping/pong", (done) => {
  jest.useFakeTimers({ advanceTimers: true });

  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    config: { heartbeatInterval: 5000 },
  });

  //@ts-ignore -- private prop
  const authSpy = jest.spyOn(socket, "authentication");

  //@ts-ignore -- private prop
  const conSpy = jest.spyOn(socket, "connection");

  //@ts-ignore -- private prop
  const conErrSpy = jest.spyOn(socket, "connectionError");

  //@ts-ignore -- private prop
  const connectedSpy = jest.spyOn(socket, "connected");

  //@ts-ignore -- private prop
  const pingSpy = jest.spyOn(socket, "ping");

  //@ts-ignore -- private prop
  const removeConSpy = jest.spyOn(socket, "removeConnection");

  //@ts-ignore -- private prop
  const closeSocketSpy = jest.spyOn(socket, "closeSocket");

  //todo also create a stable version of this test, that does not keep reconnecting, just to be 100% sure, yayayaya
  let reconTimes = 0;

  socket.eventHub.status.subscribe((conn) => {
    if (conn === "connected") {
      reconTimes++;

      if (reconTimes >= 5) {
        //settimeout to give time to disconnect for the server
        setTimeout(() => {
          expect(authSpy).toHaveBeenCalledTimes(reconTimes);

          expect(conSpy).toHaveBeenCalledTimes(reconTimes);

          expect(connectedSpy).toHaveBeenCalledTimes(reconTimes);

          //-1 cuz not pinged yet
          expect(pingSpy).toHaveBeenCalledTimes(reconTimes - 1);

          //-1 because not this one not yet removed
          expect(removeConSpy).toHaveBeenCalledTimes(reconTimes - 1);

          expect(conErrSpy).toHaveBeenCalledTimes(0);

          expect(closeSocketSpy).toHaveBeenCalledTimes(0);

          //@ts-ignore private prop
          expect(socket.counter).toBe(reconTimes - 1);

          expect([...socketServer.clients.values()].length).toBe(1);

          socket.stop();

          done();
        }, 10);
        return;
      }

      setTimeout(() => {
        jest.advanceTimersByTime(5000);

        setTimeout(() => {
          jest.advanceTimersByTime(2000);

          //   expect(socket.getStatus()).toBe("connected");

          //   //From the ping
          //   expect(connectedSpy).toHaveBeenCalledTimes(2);

          //   //from connected
          //   expect(pingSpy).toHaveBeenCalledTimes(1);

          //   expect(authSpy).toHaveBeenCalledTimes(1);
          //   expect(conSpy).toBeCalledTimes(1);

          //   expect(conErrSpy).toBeCalledTimes(0);
          //   expect(closeSocketSpy).toBeCalledTimes(0);
        }, 50);

        // jest.advanceTimersByTime(2000);
      }, 10);
    }
  });

  socket.start();
});

it("should try heartbeat on offline", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    config: { heartbeatInterval: 5000 },
    // logLevel: 0,
  });

  //@ts-ignore -- private prop
  const heartbeatSpy = jest.spyOn(socket, "tryHeartbeat");

  //@ts-ignore -- private prop
  const pingSpy = jest.spyOn(socket, "ping");

  socket.eventHub.status.subscribe((conn) => {
    if (conn === "connected") {
      globalWindow.notify("offline");

      //hearbeat is called, and since we're connected a ping is called
      expect(heartbeatSpy).toBeCalledTimes(1);
      expect(pingSpy).toBeCalledTimes(1);

      socket.stop();

      done();
    }
  });

  socket.start();
});

it("should noop heartbeat on offline, when not connected", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    config: { heartbeatInterval: 5000 },
    // logLevel: 0,
  });

  //@ts-ignore -- private prop
  const heartbeatSpy = jest.spyOn(socket, "tryHeartbeat");

  //@ts-ignore -- private prop
  const pingSpy = jest.spyOn(socket, "ping");

  socket.start();

  globalWindow.notify("offline");

  //hearbeat is called, but since not yet connected, it's noop
  expect(heartbeatSpy).toBeCalledTimes(1);
  expect(pingSpy).toBeCalledTimes(0);

  socket.stop();

  done();
});

it("should try heartbeat on focus", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    config: { heartbeatInterval: 5000 },
    // logLevel: 0,
  });

  //@ts-ignore -- private prop
  const heartbeatSpy = jest.spyOn(socket, "tryHeartbeat");

  //@ts-ignore -- private prop
  const pingSpy = jest.spyOn(socket, "ping");

  socket.eventHub.status.subscribe((conn) => {
    if (conn === "connected") {
      globalWindow.notify("focus");

      //hearbeat is called, and since we're connected a ping is called
      expect(heartbeatSpy).toBeCalledTimes(1);
      expect(pingSpy).toBeCalledTimes(1);

      socket.stop();

      done();
    }
  });

  socket.start();
});

it("should noop heartbeat on focus, when not connected", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    config: { heartbeatInterval: 5000 },
    // logLevel: 0,
  });

  //@ts-ignore -- private prop
  const heartbeatSpy = jest.spyOn(socket, "tryHeartbeat");

  //@ts-ignore -- private prop
  const pingSpy = jest.spyOn(socket, "ping");

  socket.start();

  globalWindow.notify("focus");

  //hearbeat is called, but since not yet connected, it's noop
  expect(heartbeatSpy).toBeCalledTimes(1);
  expect(pingSpy).toBeCalledTimes(0);

  socket.stop();

  done();
});

it("should connect send data, recieve, close", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    config: { heartbeatInterval: 5000 },
    waitForRoom: true,
    connectionResolver(message, resolver, _rejecter) {
      if (message.data === "OK") {
        resolver();
      }
    },

    // logLevel: 0,
  });

  let messageRecieved = false;

  socketServer.on("connection", (con) => {
    con.send("OK");
    con.addEventListener("message", (e) => {
      if (e.data === "hey gimme a job") {
        con.send("you got it bruh!");
      }
    });

    con.addEventListener("close", () => {
      if (messageRecieved) done();
    });
  });

  socket.eventHub.status.subscribe((conn) => {
    if (
      conn === "authError" ||
      conn === "connectionError" ||
      conn === "failed"
    ) {
      done("should never happen");
      return;
    }

    if (conn === "connected") {
      socket.send("hey gimme a job");
    }
  });

  socket.eventHub.messages.subscribe((message) => {
    if (message.data === "you got it bruh!") {
      expect([...socketServer.clients.values()].length).toBe(1);

      //@ts-ignore private prop
      expect(socket.counter).toBe(0);

      messageRecieved = true;

      socket.close();
    }
  });

  socket.start();
});

//todo a variant of this, with close by server & auto reconnect by client
it("should connect send data, recieve, close, reconnect, send data, stop", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    waitForRoom: true,
    connectionResolver(message, resolver, _rejecter) {
      if (message.data === "OK") {
        resolver();
      }
    },
    // logLevel: 0,
  });

  let messageRecieved = false;
  let firstClose = false;
  let didReconnect = false;
  let sentDataAfterReconnect = false;
  let closeAfterReconnect = false;

  socketServer.on("connection", (con) => {
    con.send("OK");
    con.addEventListener("message", (e) => {
      if (e.data === "hey gimme a job") {
        con.send("you got it bruh!");
      }

      if (e.data === "thankx") {
        if (!didReconnect || sentDataAfterReconnect)
          done("should never happen");
        sentDataAfterReconnect = true;
      }
    });

    con.addEventListener("close", () => {
      if (messageRecieved && !firstClose) {
        firstClose = true;
        return;
      }
    });
  });

  socket.eventHub.status.subscribe((conn) => {
    if (
      conn === "authError" ||
      conn === "connectionError" ||
      conn === "failed"
    ) {
      done("should never happen");
      return;
    }

    if (conn === "connected") {
      if (!messageRecieved && !firstClose) {
        socket.send("hey gimme a job");
        return;
      }

      didReconnect = true;
      socket.send("thankx");

      socket.stop();

      setTimeout(() => {
        if (sentDataAfterReconnect) {
          closeAfterReconnect = true;

          expect([...socketServer.clients.values()].length).toBe(0);

          //0 on start
          //1 on close
          //2 on reconnect
          //3 on stop
          //@ts-ignore
          expect(socket.counter).toBe(3);

          done();
        }
      }, 10);
    }

    //ok this may not be the best place for this
    if (conn === "initial" && messageRecieved) {
      //@ts-ignore
      if (socket.counter === 1) {
        socket.reconnect();
      }
    }
  });

  socket.eventHub.messages.subscribe((message) => {
    if (message.data === "you got it bruh!") {
      expect([...socketServer.clients.values()].length).toBe(1);

      //@ts-ignore private prop
      expect(socket.counter).toBe(0);

      messageRecieved = true;

      socket.close();
    }
  });

  socket.start();
});

it("should start, stop & restart, send data, recieve data", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    // logLevel: 0,
  });

  socketServer.on("connection", (con) => {
    con.addEventListener("message", (e) => {
      if (e.data === "hey gimme a job") {
        con.send("you got it bruh!");
      }
    });
  });

  socket.eventHub.messages.subscribe((message) => {
    if (message.data === "you got it bruh!") {
      setTimeout(() => {
        //@ts-ignore private prop
        expect(socket.counter).toBe(1);

        expect([...socketServer.clients.values()].length).toBe(1);

        socket.close();

        done();
      }, 50);
    }
  });

  socket.eventHub.status.subscribe((conn) => {
    if (conn === "connected") {
      socket.send("hey gimme a job");
    }
  });

  socket.start();
  socket.stop();
  socket.start();
});

//ok this is a weird test case, not sure honestly if it's even testing anything useful, and real world
it("should handle when server closes socket immediately", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
  });

  socketServer.on("connection", (con) => {
    // console.log(`server`);
    // console.log([...socketServer.clients.values()].length);
    con.close(4000);

    con.addEventListener("message", () => {});
  });

  socket.eventHub.status.subscribe((conn) => {
    //@ts-ignore
    if (conn === "connected" && socket.counter === 6) {
      setTimeout(() => {
        expect(socket.getStatus()).toBe("closed");
        expect([...socketServer.clients.values()].length).toBe(0);

        done();
      }, 60);
    }
  });

  socket.start();
  socket.reconnect();
  socket.reconnect();
  socket.reconnect();
  socket.reconnect();
  socket.reconnect();
  socket.reconnect();
});

it("should handle the chaos, fuzz testing 1", (done) => {
  // jest.useFakeTimers({ advanceTimers: true });

  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    // logLevel: 0,
    config: { heartbeatInterval: 3000 },
    auth: () => {
      if (Math.random() % 2 === 0) throw new Error("auth error");
    },
  });

  //since odd, it'll start at last
  //@ts-ignore
  while (socket.counter < 101) {
    if (socket.started) {
      if (Math.floor(Math.random() * 2) % 2 === 0) socket.stop();
    } else {
      socket.start();
      socket.reconnect();

      socket.reconnect();

      socket.reconnect();

      socket.reconnect();
    }
  }

  setTimeout(() => {
    expect(socket.getStatus()).toBe("connected");
    expect([...socketServer.clients.values()].length).toBe(1);

    socket.stop();

    done();
  }, 1000);
}, 15000);

it("should handle the chaos, fuzz testing 2", (done) => {
  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    // logLevel: 0,
    config: { heartbeatInterval: 3000 },
    auth: () => {
      if (Math.random() % 2 === 0) throw new Error("auth error");
    },
  });

  //@ts-ignore
  while (socket.counter < 100) {
    if (socket.started) {
      if (Math.floor(Math.random() * 2) % 2 === 0) socket.stop();
    } else {
      socket.start();
      socket.reconnect();

      socket.reconnect();

      socket.reconnect();

      socket.reconnect();
    }
  }

  setTimeout(() => {
    expect(socket.getStatus()).toBe("closed");
    expect([...socketServer.clients.values()].length).toBe(0);

    socket.stop();

    done();
  }, 1000);
});

//todo do a proper fuzz test, with heartbeats, server close, auto reconnects, manual reconnects, all at once
it("should handle the chaos, fuzz testing 3 go nuts", (done) => {
  // jest.useFakeTimers({ advanceTimers: true });

  const socket = new PartySocket({
    host: SOCKET_URL,
    room: "BOB",
    // logLevel: 0,
    config: { heartbeatInterval: 3000 },
    auth: () => {
      if (Math.random() % 2 === 0) throw new Error("auth error");
    },
  });

  //@ts-ignore
  while (socket.counter < 101) {
    if (socket.started) {
      if (Math.floor(Math.random() * 2) % 2 === 0) socket.stop();
      setTimeout(() => {
        if (Math.floor(Math.random() * 2) % 2 === 0) socket.stop();
      }, Math.floor(Math.random() * 1000));
    } else {
      socket.start();
      socket.reconnect();
      setTimeout(() => {
        socket.start();
        socket.reconnect();

        socket.reconnect();

        socket.reconnect();

        socket.reconnect();
      }, Math.floor(Math.random() * 1000));
    }
  }

  setTimeout(() => {
    // expect(socket.getStatus()).toContain(["connected"] );

    if (socket.getStatus() === "connected") {
      expect([...socketServer.clients.values()].length).toBe(1);
    } else {
      expect(socket.getStatus()).toBe("closed");
      expect([...socketServer.clients.values()].length).toBe(0);
    }

    socket.stop();

    done();
  }, 1500);
});

// it("should try fuzz test", (done) => {
// const quickInterval = setInterval(() => {
//   if (socket.getStatus() === "connected") {
//     socket.send("pop");
//   }
// }, 1000);
// const mediumInterval = setInterval(() => {
//   Math.floor(Math.random() * 10) % 2 === 0
//     ? jest.advanceTimersByTime(2000)
//     : jest.advanceTimersByTime(20000);
//   Math.floor(Math.random() * 10) % 2 === 0
//     ? socket.reconnect()
//     : jest.advanceTimersByTime(5000);
// }, 5000);
// const longInterval = setInterval(() => {
//   if (socket.started) {
//     socket.close();
//   } else {
//     socket.start();
//     socket.reconnect();
//     socket.reconnect();
//   }
// }, 10000);
// setTimeout(() => {
//   clearInterval(quickInterval);
//   clearInterval(mediumInterval);
//   clearInterval(longInterval);
//   console.log([...socketServer.clients.values()].length);
//   if (socket.started) socket.stop();
//   setTimeout(() => {
//     console.log(`called`);
//     console.log([...socketServer.clients.values()].length);
//     done();
//   }, 2000);
// }, 55000);
// })
