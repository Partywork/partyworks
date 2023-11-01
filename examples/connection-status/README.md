# connection status + lost connection

- this example is taken from [liveblocks example](https://github.com/liveblocks/liveblocks/tree/main/examples/nextjs-connection-status) & is implemented using partyworks. which is also exposing similar (some differences) apis, as it's inspired form liveblocks itself.

this is a connection status example, where we can see the live status of our socket connection. also we have the ability to show toast notifications in case we lose the connection it's all easily configurable. the connection is failed after 10 consecutive failed attempts. everything is easily configurable

```typescript
const client = createClient({
  host: process.env.NEXT_PUBLIC_PARTY_URL || "localhost:1999",
  config: {
    maxConnTries: 10, //to also simulate disconnect
  },
  lostConnectionTimeout: 2000, //for the popup/toast notification
});
```
