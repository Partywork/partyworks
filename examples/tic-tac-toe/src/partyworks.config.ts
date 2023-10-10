import { ClientEvents } from "./interface/types";
import { createRoomContext } from "./partyworks/React";
import { createClient } from "./partyworks/core";

const client = createClient({
  host: process.env.NEXT_PUBLIC_WS_URL || "wss://localhost:1999",
});

export type Chat = {
  userId: string;
  username: string;
  msg: string;
};

type Presence = {
  currentGame?: string;
};

type UserMeta = {
  userId: string;
  username: string;
};

type Broadcast = {
  type: "chat";
  data: Chat;
};

//let's just chill for a sec
type Listeners = {};

//just chill chill just chill
type Emitters = {
  [ClientEvents.CREATE_GAME]: "tic-tac-toe";
  [ClientEvents.JOIN_GAME]: "tic-tac-toe";
  [ClientEvents.MAKE_MOVE]: { index: number };
};

export const {
  RoomProvider,
  useRoom,
  useOthers,
  useSelf,
  useEventListener,
  useBroadcastEvent,
  useMessage,
  useError,
} = createRoomContext<Presence, UserMeta, Broadcast, Listeners, Emitters>(
  client
);
