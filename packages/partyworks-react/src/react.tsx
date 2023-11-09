import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  // TODO replace this with the shim
  useSyncExternalStore,
} from "react";

import type {
  Peer,
  PartyClient,
  RoomBroadcastEventListener,
} from "partyworks-client";
import { PartyWorksRoom, shallow } from "partyworks-client";

import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector";
import { LostConnectionStatus } from "partyworks-client";

//* API
//* [createRoomContext, RoomProvider, useRoom, useStatus]
//* [useMyPresence, useUpdateMyPresence, useSelf, useOthers, useOthersMapped, useOthersConnectionIds, useOther]
//* [useBroadcastEvent, useEventListener]
//* [useStatus]
//* custom events endpoint

interface RoomProviderProps {
  roomId: string;
  children: React.ReactNode;
}

const same: <T>(data: T) => T = (data) => data;

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

    if (!roomId) throw new Error("roomId is required");

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

    if (!room) throw new Error(`room access before initialization`);

    return room;
  }

  const empty: any = [];

  function emptyOthers() {
    return empty;
  }

  function useOthers(): readonly Peer<TPresence, TUserMeta>[];
  function useOthers<T>(
    selector: (others: readonly Peer<TPresence, TUserMeta>[]) => T,
    isEqual?: (prev: T, curr: T) => boolean
  ): T;
  function useOthers<T>(
    selector?: (others: readonly Peer<TPresence, TUserMeta>[]) => T,
    isEqual?: (prev: T, curr: T) => boolean
  ): T | readonly Peer<TPresence, TUserMeta>[] {
    const room = useRoom();

    const subscribeFn = room.eventHub.others.subscribe;
    const getSnapshot = room.getOthers;
    const getServerSnapshot = emptyOthers;

    return useSyncExternalStoreWithSelector(
      subscribeFn,
      getSnapshot,
      getServerSnapshot,
      selector || same,
      isEqual
    );
  }

  function useOthersMapped<T>(
    selector: (other: Peer<TPresence, TUserMeta>) => T,
    isEqual?: (prev: T, curr: T) => boolean
  ): ReadonlyArray<readonly [userId: string, data: T]> {
    const mapSelector = useCallback(
      (others: readonly Peer<TPresence, TUserMeta>[]) =>
        others.map((other) => [other.userId, selector(other)] as const),
      [selector]
    );

    const mapIsEqual = useCallback(
      (
        a: ReadonlyArray<readonly [userId: string, data: T]>,
        b: ReadonlyArray<readonly [userId: string, data: T]>
      ): boolean => {
        if (a.length !== b.length) return false;

        if (isEqual) {
          return a.every(([userId, value], index) => {
            const [userBId, userBValue] = b[index];
            return userId === userBId && isEqual(value, userBValue);
          });
        }

        return a.every(([userId, value], index) => {
          const [userBId, userBValue] = b[index];
          return userId === userBId && Object.is(value, userBValue);
        });
      },
      [isEqual]
    );

    return useOthers(mapSelector, mapIsEqual);
  }

  function useOthersConnectionIds(): readonly string[] {
    const selector = useCallback(
      (others: readonly Peer<TPresence, TUserMeta>[]): string[] => {
        return others.map((user) => user.userId);
      },
      []
    );

    return useOthers(selector, shallow);
  }

  function useOther<T>(
    userId: string,
    selector: (other: Peer<TPresence, TUserMeta>) => T,
    isEqual?: (prev: T, curr: T) => boolean
  ): T {
    const otherSelector = useCallback(
      (others: readonly Peer<TPresence, TUserMeta>[]) => {
        const other = others.find((other) => other.userId === userId);
        if (other === undefined) {
          throw new Error(`No such peer user with userId ${userId} exists`);
        }
        return selector(other);
      },
      [userId, selector]
    );

    const otherIsEqual = useCallback(
      (prev: T, curr: T): boolean => {
        const eq = isEqual ?? Object.is;
        return eq(prev, curr);
      },
      [isEqual]
    );

    const other = useOthers(otherSelector, otherIsEqual);

    return other;
  }

  function useSelf() {
    const room = useRoom();

    const subscribeFn = room.eventHub.self.subscribe;
    const getSnapshot = room.getSelf;
    const getServerSnapshot = useCallback(() => undefined, []);

    return useSyncExternalStore(subscribeFn, getSnapshot, getServerSnapshot);
  }

  function useMyPresence(): [
    TPresence | undefined,
    PartyWorksRoom<TPresence>["updatePresence"]
  ] {
    const room = useRoom();

    const subscribeFn = room.eventHub.myPresence.subscribe;
    const getSnapshot = room.getPresence;
    const getServerSnapshot = useCallback(() => undefined, []);

    const presence = useSyncExternalStore(
      subscribeFn,
      getSnapshot,
      getServerSnapshot
    );
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

  function useStatus() {
    const room = useRoom();

    const subscribeFn = room.eventHub.status.subscribe;
    const getSnapshot = room.getStatus;

    //? should we add a selector,
    return useSyncExternalStore(subscribeFn, getSnapshot, getSnapshot);
  }

  function useLostConnectionListener(
    listener: (data: LostConnectionStatus) => void
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

      return room.eventHub.lostConnection.subscribe(listener);
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
    useOthersConnectionIds,
    useOthersMapped,
    useOther,
    useSelf,
    useMyPresence,
    useUpdateMyPresence,
    useBroadcastEvent,
    useEventListener,
    useMessage,
    useAllMessage, //WELL JUST PROVIDING IT :/
    useError,
    useStatus,
    useLostConnectionListener,
  };
}
