import { PartyWorksRoom, PartyWorksRoomOptions } from "./lib/PartyWorksClient";

//* THIS IS CLIENT
//* API [batch & throttle, ENTER, LEAVE, MULTI-ROOM-SUPPORT]

export interface PartyWorksClient {
  enter: <
    TPresence = any,
    TUserMeta = any,
    TBroadcastEvent = any,
    TEvents extends Record<string, any> = {},
    TEventsEmitter = any
  >(
    roomId: string,
    options: PartyworksRoomEnterOptions<TPresence>
  ) => PartyWorksRoom<
    TPresence,
    TUserMeta,
    TBroadcastEvent,
    TEvents,
    TEventsEmitter
  >;
  leave: (roomId: string) => void;
}

export type PartyworksClientOptions = Omit<
  PartyWorksRoomOptions,
  "room" | "initialPresence"
>;

export type PartyworksRoomEnterOptions<TPresence = any> = Pick<
  PartyWorksRoomOptions<TPresence>,
  "initialPresence"
>;

//but here also we need to provide a way to manuaaly connect
export const createClient = (
  createClientOptions: PartyworksClientOptions
): PartyWorksClient => {
  //i guess this is for future multirom support
  const rooms = new Map<string, PartyWorksRoom<any>>();

  function enter(roomId: string, options: PartyworksRoomEnterOptions) {
    const existingRoom = rooms.get(roomId);

    if (existingRoom) {
      return existingRoom;
    }

    const room = new PartyWorksRoom({
      ...createClientOptions,
      ...options,
      room: roomId,
    });
    rooms.set(roomId, room);

    //only connect in browser settings for now <>
    if (typeof window !== "undefined") {
      room.connect();
    }

    return room as any;
  }

  function leave(roomId: string) {
    const room = rooms.get(roomId);

    if (room) {
      room.leave();

      rooms.delete(roomId);
    }
  }

  return {
    enter,
    leave,
  };
};
