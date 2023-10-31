import { createClient } from "partyworks-client";
import { createRoomContext } from "partyworks-react";

const client = createClient({
  host: process.env.PARTY_URL || "localhost:1999",
  auth: () => {
    if (typeof window !== "undefined") {
      return {
        data: {
          name: new URLSearchParams(window.location.search).get("name"),
        },
      };
    }
  },
});

export type ChatMessage = {
  text: string;
  username: string;
};

export type Presence = {
  isTyping: boolean;
};

export type UserMeta = {
  username: string;
  bot?: boolean;
};

type BroadcastEvent = {
  type: "message";
  data: ChatMessage;
};

export const {
  RoomProvider,
  useOthers,
  useSelf,
  useUpdateMyPresence,
  useBroadcastEvent,
  useRoom,
  useEventListener,
} = createRoomContext<Presence, UserMeta, BroadcastEvent>(client);
