import { createClient } from "partyworks-client";
import { createRoomContext } from "partyworks-react";

const client = createClient({
  host: "localhost:1999",

  //throttle can be whatever value you want, from 0 - Infinity (default is 16 --- almost close to 60fps as what most game loop implements)
  throttle: 16, //by default this is 16, so you can choose to not add it here
});

// Presence represents the properties that will exist on every User in the Room
// and that will automatically be kept in sync. Accessible through the
// `user.presence` property. Must be JSON-serializable.
type Presence = {
  cursor?: { x: number; y: number };
};

// Optionally, Storage represents the shared document that persists in the
// Room, even after all Users leave. Fields under Storage typically are
// LiveList, LiveMap, LiveObject instances, for which updates are
// automatically persisted and synced to all connected clients.
type UserMeta = {
  // ...
  color: string;
};

// Optionally, UserMeta represents static/readonly metadata on each User, as
// provided by your own custom auth backend (if used). Useful for data that
// will not change during a session, like a User's name or avatar.
// type UserMeta = {
//   id?: string,  // Accessible through `user.id`
//   info?: Json,  // Accessible through `user.info`
// };

// Optionally, the type of custom events broadcasted and listened for in this
// room. Must be JSON-serializable.
// type RoomEvent = {};

export const { RoomProvider, useOthers, useMyPresence } = createRoomContext<
  Presence,
  UserMeta /* UserMeta, RoomEvent */
>(client);
