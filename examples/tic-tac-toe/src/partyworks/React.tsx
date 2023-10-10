import { PartyClient } from "./core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  PartyWorksRoom,
  RoomBroadcastEventListener,
} from "./lib/PartyWorksClient";
import { Peer } from "./immutables/ImmutableOthers";

//* API
//* [createRoomContext, RoomProvider, useRoom, useStatus]
//* [useMyPresence, useUpdateMyPresence, useSelf, useOthers, useOthersMapped, useOthersConnectionIds, useOther]
//* [useBroadcastEvent, useEventListener]
//* custom events endpoint

interface RoomProviderProps {
  roomId: string;
  children: React.ReactNode;
}

export function createRoomContext<
  TPresence = any,
  TUserMeta = any,
  TBroadcast = any,
  TEvents extends Record<string, any> = any,
  TEventEmitters extends Record<string, any> = any
>(client: PartyClient) {
  const RoomContext = createContext<PartyWorksRoom<
    TPresence,
    TUserMeta,
    TBroadcast,
    TEvents,
    TEventEmitters
  > | null>(null);

  //returna room provider context
  // const RoomProvider

  function RoomProvider(props: RoomProviderProps) {
    const { children, roomId } = props;

    const [room, setRoom] = useState(
      client.enter(roomId) as PartyWorksRoom<
        TPresence,
        TUserMeta,
        TBroadcast,
        TEvents,
        TEventEmitters
      >
    );

    useEffect(() => {
      const room = client.enter(roomId) as PartyWorksRoom<
        TPresence,
        TUserMeta,
        TBroadcast,
        TEvents,
        TEventEmitters
      >;

      setRoom(room);

      return () => client.leave(roomId);
    }, [roomId]);

    return <RoomContext.Provider value={room}>{children}</RoomContext.Provider>;
  }

  function useRoom() {
    const room = useContext(RoomContext);

    if (!room) throw new Error(`room acces before initialization`);

    return room;
  }

  const empty: any = [];

  function emptyOthers() {
    return empty;
  }

  function useOthers(): readonly Peer<TPresence, TUserMeta>[] {
    const room = useRoom();

    const sub = room.eventHub.others.subscribe;
    const snap = room.getOthers;
    const emp = emptyOthers;

    return useSyncExternalStore(sub, snap, emp);
  }

  function useSelf() {
    const room = useRoom();

    const sub = room.eventHub.self.subscribe;
    const snap = room.getSelf;
    const getServerSnapshot = useCallback(() => undefined, []);

    return useSyncExternalStore(sub, snap, getServerSnapshot);
  }

  function useMyPresence(): [
    TPresence | undefined,
    PartyWorksRoom<TPresence>["updatePresence"]
  ] {
    const room = useRoom();

    const sub = room.eventHub.myPresence.subscribe;
    const snap = room.getPresence;
    const getServerSnapshot = useCallback(() => undefined, []);

    const presence = useSyncExternalStore(sub, snap, getServerSnapshot);
    const updatePresence = room.updatePresence;

    return [presence, updatePresence];
  }

  function useUpdateMyPresence() {
    return useRoom().updatePresence;
  }

  function useBroadcastEvent() {
    return useRoom().broadcast;
  }

  function useEventListener(
    listener: (
      data: RoomBroadcastEventListener<TPresence, TUserMeta, TBroadcast>
    ) => void
  ) {
    const room = useRoom();
    const savedRef = useRef(listener);

    useEffect(() => {
      savedRef.current = listener;
    });

    useEffect(() => {
      const listener = (data: any) => {
        savedRef.current(data);
      };

      //@ts-ignore this will auto unsub
      return room.eventHub.event.subscribe(listener);
    }, [room]);
  }

  function useMessage(listener: (data: MessageEvent<any>) => void) {
    const room = useRoom();
    const savedRef = useRef(listener);

    useEffect(() => {
      savedRef.current = listener;
    });

    useEffect(() => {
      const listener = (data: any) => {
        savedRef.current(data);
      };

      return room.eventHub.message.subscribe(listener);
    }, [room]);
  }

  function useAllMessage(listener: (data: MessageEvent<any>) => void) {
    const room = useRoom();
    const savedRef = useRef(listener);

    useEffect(() => {
      savedRef.current = listener;
    });

    useEffect(() => {
      const listener = (data: any) => {
        savedRef.current(data);
      };

      return room.eventHub.allMessages.subscribe(listener);
    }, [room]);
  }

  function useError(listener: (data: any) => void): void;
  function useError(
    event: string | number | "all",
    listener: (data: any) => void
  ): void;

  //ok maybe we want the ref to make sure it's updated :/
  function useError(
    ...data: [string | number, (data: any) => void] | [(data: any) => void]
  ) {
    const room = useRoom();

    const savedRef = useRef(
      (typeof data[0] === "function" ? data[0] : data[1]) as (data: any) => void
    );
    useEffect(() => {
      savedRef.current = (
        typeof data[0] === "function" ? data[0] : data[1]
      ) as (data: any) => void;
    });

    useEffect(() => {
      let listener: (data: any) => void;

      if (typeof data[0] !== "function") {
        listener = (error: any) => {
          if (error.event && error.event !== data[0]) return;

          savedRef.current(error);
        };
      } else {
        listener = (error: any) => {
          console.log(`calling`);
          savedRef.current(error);
        };
      }

      return room.eventHub.error.subscribe(listener);
    }, [room]);
  }

  return {
    RoomProvider,
    useRoom,
    useOthers,
    useSelf,
    useMyPresence,
    useUpdateMyPresence,
    useBroadcastEvent,
    useEventListener,
    useMessage,
    useAllMessage, //WELL JUST PROVIDING IT :/
    useError,
  };
}
