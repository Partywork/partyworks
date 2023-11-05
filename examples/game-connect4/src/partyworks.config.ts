import { createClient } from "partyworks-client";
import { createRoomContext } from "partyworks-react";
import {
  ClientEvents,
  Game,
  GameResults,
  Move,
  Player,
  RPSMoveData,
  ServerEvents,
} from "./types";
import { Connect4MoveData } from "./components/connect-4/types";

type Presence = {
  isTyping?: boolean;
};

type UserMeta = Player;

type Broadcast = {
  event: "message";
  data: {
    username: string;
    message: string;
  };
};

type ListenerEvents = {
  [ServerEvents.ROOM_STATE]: {
    game: any;
  };
  [ServerEvents.GAME_CREATED]: { game: Game };
  [ServerEvents.GAME_USER_JOINED]: {
    user: Player;
  };
  [ServerEvents.GAME_STARTED]: {
    gameState: any;
  };
  [ServerEvents.PLAY]: Move;
  [ServerEvents.GAME_COMPLETED]: GameResults;
  [ServerEvents.GAME_DELETED]: undefined;
};

type EmitterEvents = {
  [ClientEvents.CREATE_GAME]: undefined;
  [ClientEvents.JOIN_GAME]: undefined;
  [ClientEvents.MAKE_MOVE]: Connect4MoveData;
  [ClientEvents.RESIGN_GAME]: undefined;
  [ClientEvents.DELETE_GAME]: undefined;
};

const client = createClient({
  host: process.env.NEXT_PUBLIC_PARTY_URL || "localhost:1999",
});

export const {
  RoomProvider,
  useRoom,
  useMessage,
  useSelf,
  useOthers,
  useUpdateMyPresence,
  useBroadcastEvent,
  useEventListener,
} = createRoomContext<
  Presence,
  UserMeta,
  Broadcast,
  ListenerEvents,
  EmitterEvents
>(client);
