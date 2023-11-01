import { createClient } from "partyworks-client";
import { createRoomContext } from "partyworks-react";

const client = createClient({
  host: process.env.NEXT_PUBLIC_PARTY_URL || "localhost:1999",
  config: {
    maxConnTries: 10, //to also simulate disconnect
  },
  lostConnectionTimeout: 2000,
});

export const { RoomProvider, useStatus, useLostConnectionListener } =
  createRoomContext(client);
