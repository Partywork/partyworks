# party-socket-test

**Note**:- This is somewhat experimental at this point, so don't use it in production,
**party-socket-test** is a reconnecting websocket class, with **more accuracy**, allows Ping/Pong, intended to be used with [partykit](https://www.partykit.io/)

### Installation

```bash
npm i party-socket-test
```

### Basic Usage

Client-side:

```typescript
import { PartySocket } from "party-socket-test";

const socket = new PartySocket({
  host: "localhost:1999",
  room: "boba",
  logLevel: 0, // Listen to all logs
});

// Starts the connection engine
socket.start();

// Similar to .addEventListener("message")
socket.eventHub.messages.subscribe((message) => {
  // console.log(message.data);
});

//Updates when status changes
sock.eventHub.status.subscribe((status) => {
  //logs engine status. use this if you need a more detailed one
  console.log(status);

  //logs 'connected' | 'closed' | 'initial' | 'failed' | 'connecting' | 'reconnecting'
  console.log(socket.getStatus());
});

// Closes the socket
socket.close();

// Reconnects, this will drop the current connection if there is one
socket.reconnect();

// Closes the socket if any, stops the engine, no further messages accepted
// until .start() is called again
socket.stop();
```

Server-side:

```typescript
import { Connection, Server } from "partykit/server";

export default class Playground implements Server {
  onMessage(message: string | ArrayBuffer, sender: Connection<unknown>) {
    // Send pong for ping
    if (message === "PING") {
      sender.send("PONG");
    }
  }
}
```

### Authentication

```typescript
new PartySocket({
  host: "localhost:1999", // The host
  room: "boba", // Room name/id

  auth: async () => {
    return {
      // Data will be included in the query that is sent to the server,
      // similar to how partysocket works
      data: { token: "heheheheh" },

      host: "new host", // This will override the one in the config
      room: "new room", // This will override the one in the config
    };
  },
});
```

### Configuration

```typescript
new PartySocket({
  host: "localhost:1999", // The host
  room: "boba", // Room name/id
  logLevel: 3, // Logs 0, 1, 2, 3, default is none,
  config: {
    // The time to wait for auth to resolve
    authTimeout: 20000, // 20 seconds, default is 10 sec

    // The backoff after each unsuccessful auth try
    authBackoff: [250, 500, 1000, 2000, 5000], // Default is [250, 500, 1000, 5000]

    // The time to wait for socket connection
    socketConnectTimeout: 20000, // 20 seconds, default is 10 sec

    // The backoff after each unsuccessful connection try
    connectionBackoff: [250, 500, 1000, 2000, 5000], // Default is [250, 500, 1000, 5000]

    // The interval for ping/pong
    heartbeatInterval: 10000, // 10 seconds, default is 30 seconds

    // Max auth tries after consecutive failure
    maxAuthTries: 10, // Default is 5

    // Max connection tries after consecutive failure
    maxConnTries: 10, // Default is 5
  },
});
```

// Docs are incomplete; there are some other config methods...
