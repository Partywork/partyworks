import PartySocket, { PartySocketOptions } from "../partysocket";
import { ImmutableObject } from "../immutables/ImmutableObject";
import { ImmutablePeers, Peer } from "../immutables/ImmutableOthers";
import { PartyWorksEventSource, SingleEventSource } from "./EventSource";
import { InternalEvents } from "./types";
import { v4 as uuid } from "uuid";

interface BaseUser {
  data: {
    id: string; //internal partykit id or something
    _pkUrl: string;
  };
}

export interface Self<T = any, K = any> extends BaseUser {
  info: T;
  presence?: K;
}

type EmitAwaiOptions = {
  listenEvent?: string;

  maxTime?: number; //max time to await for a response, defaults to 5000

  //* below are the configurable props so it can be handled by the user choice
  //TODO use these eventually when we have status, and buffer queues
  behaviourOnDisconnect: "queue" | "fail" | "noop" | "continue";
  failOnDisconnect?: boolean;
  noopOnDisonnect?: boolean;
  shouldQueue?: boolean;
};
//we need to provide 2 things
//one interface for emiting events, this can lead to duplicate stuff, but can be easily extedmed with a base
//other interface is for listening events

//this is room

//* OTHERS  [option of filter, immutable ref]
//* SELF [getPresence, updatePresence, getOthers, getSelf, getStatus]
//* SUBSCRIE TO UPDATES [ boradcast, myPresence,  others, status,  ]
//* STATUS [connect, ]
//* BROADCAST API [ broadcastEvent]
//* CUSTOM EVENTS API

//i think for the internal events we can have rpc based format, but custom events can be tricky the ones that don't follow req/res format
type InternalEventsMap =
  | {
      event: InternalEvents.CONNECT;
      data: { id: string };
    }
  | {
      event: InternalEvents.ROOM_STATE;
      data: {
        self: {
          info: any; //this is TUserMeta
          data: { id: string };
        };
        users: Peer[];
      };
    }
  | {
      event: InternalEvents.USER_JOINED;
      data: { userId: string; info: any; presence: any };
    }
  | { event: InternalEvents.USER_LEFT; data: { userId: string } }
  | {
      event: InternalEvents.PRESENSE_UPDATE;
      data: { userId: string; data: any };
    }
  | {
      event: InternalEvents.BROADCAST;
      data: { data: any; userId: string };
    };

export enum InternalListeners {
  Message = "message",
  SelfUpdate = "selfUpdate",
  RoomUpdate = "roomUpdate",
  UserJoined = "userJoined",
  UserLeft = "userLeft",
}

export interface InternalListenersMap<T = any> {
  message: MessageEvent<any>;
  selfUpdate: {};
  roomUpdate: { data: { others: Peer[] } };
  userJoined: { peer: Peer };
  userleft: { peer: Peer };
  peersUpdate: {};
  presenceUpdate: T;
  broadcast: { data: { data: any; userId: string } };
}

export interface RoomBroadcastEventListener<
  TPresence,
  TUserMeta,
  TBroadcastEvent
> {
  data: TBroadcastEvent;
  user: Peer<TPresence, TUserMeta> | null;
  userId: string;
}

//so we can make .on .off .emitAwait events for the customEvents
//subscribe for the internal events

export class PartyWorksRoom<
  TPresence = any,
  TUserMeta = any,
  TBroadcastEvent = any,
  TEvents extends Record<string, any> = {},
  TEventsEmit = any //this should be for emitting the event
> extends PartyWorksEventSource<TEvents> {
  _partySocket: PartySocket;
  _loaded: boolean = false; //we count that we're still connecting if this is not laoded yet
  _self?: ImmutableObject<Self<TUserMeta, TPresence>>; //not sure how to structure this one?
  _peers: ImmutablePeers<TPresence, TUserMeta>;
  eventHub: {
    allMessages: SingleEventSource<MessageEvent<any>>; //for all the messages, servers as socket.addEventlistener("message")
    message: SingleEventSource<MessageEvent<any>>; //for all but internal messages, internal ones will be ignored, most likely user's use this one
    others: SingleEventSource<any>; //others/peers in the room
    self: SingleEventSource<any>; //self
    myPresence: SingleEventSource<any>; //a local my presence
    event: SingleEventSource<
      RoomBroadcastEventListener<TPresence, TUserMeta, TBroadcastEvent>
    >; //this is for broadcast api
    error: SingleEventSource<any>; //this is for event & non event based errors
  };

  constructor(options: PartySocketOptions) {
    super();

    //we will start closed
    this._partySocket = new PartySocket({
      ...options,
      minUptime: 0,
      startClosed: true,
    });

    this.eventHub = {
      allMessages: new SingleEventSource(),
      message: new SingleEventSource(),
      others: new SingleEventSource(),
      self: new SingleEventSource(),
      myPresence: new SingleEventSource(),
      event: new SingleEventSource(),
      error: new SingleEventSource(),
    };
    this._message();
    this._peers = new ImmutablePeers();
  }

  connect() {
    this._partySocket.reconnect();
    //TODO implement a proper connection state, and use it for tracking states &  bufffering
    this._partySocket.eventSource.subscribe((status) => {
      console.log(`socket status ${status}`);
    });
  }

  //lol we need to add the funcitonality to stop reconnecting on a client side close
  disConnect() {
    this._partySocket.close();
  }

  _message() {
    //for better typescript support
    // const emit = this.emit as PartyWorksClient<InternalListenersMap>["emit"];

    this.on(InternalListeners.Message, (data) => {});
    this._partySocket.addEventListener("message", (e) => {
      //this handler is always called, as it is a basic all message event handler
      // this.emit(InternalListeners.Message, e);

      this.eventHub.allMessages.notify(e);

      try {
        const parsedData = JSON.parse(e.data);

        if (
          !parsedData ||
          (typeof parsedData.event === "undefined" &&
            typeof parsedData.error === "undefined")
        ) {
          //   this should never happen
          console.error(`No event field in the response from websocket`);
          //notify when event is not there
          this.eventHub.message.notify(e);
          return;
        }

        //differentiating internal events from external ones

        //these are internal events
        if (
          Object.values(InternalEvents).includes(
            parsedData.event as InternalEvents
          ) &&
          //internal flag checker, used to track internal messages
          parsedData._pwf === "-1"
        ) {
          const data = parsedData as InternalEventsMap;

          switch (data.event) {
            // case InternalEvents.CONNECT: {
            //   this._self = { userId: data.data.id, presence: undefined };
            //   // this.emit("selfUpdate", {});

            //   break;
            // }

            //ok so initially i was going with two events connenct & room_state. (this is the same setup for funrooms)
            //but for ease and simplicity that'll be the same message now
            case InternalEvents.ROOM_STATE: {
              this._loaded = true;
              this._self = new ImmutableObject<Self>({
                data: {
                  id: this._partySocket.id,
                  _pkUrl: this._partySocket._pkurl,
                },
                info: data.data.self.info, //this is provided by the user on backend
                presence: undefined,
              });

              const usersWithoutSelf = data.data.users.filter(
                (user) => user.userId !== this._self?.current.data.id
              );
              this._peers.addPeers(usersWithoutSelf);
              this.eventHub.others.notify({});
              this.eventHub.self.notify({});
              // this.emit("roomUpdate", { data: { others: this._peers.current } });
              break;
            }

            case InternalEvents.USER_JOINED: {
              this._peers.addPeer(data.data as any);
              this.eventHub.others.notify({});
              // this.emit("userJoined", { peer: data.data });
              break;
            }

            case InternalEvents.USER_LEFT: {
              this._peers.disconnectPeer(data.data.userId);
              this.eventHub.others.notify({});
              // this.emit("userleft", { peer: data.data });
              break;
            }

            case InternalEvents.PRESENSE_UPDATE: {
              this._peers.updatePeer(data.data.userId, data.data.data);
              this.eventHub.others.notify({});
              // this.emit("peersUpdate", {});
              // console.log(data);
              break;
            }

            case InternalEvents.BROADCAST: {
              // console.log(`ccoming`);
              console.log(data.data);

              this.eventHub.event.notify({
                data: data.data.data,
                userId: data.data.userId,
                user:
                  this._peers.current.find(
                    (user) => user.userId === data.data.userId
                  ) || null,
              });
              // this.emit("broadcast", {});
              break;
            }

            default: {
              console.error(`unknown evemt`);
            }
          }
          return;
        }

        //notify the listener
        this.eventHub.message.notify(e);

        //? now i'm somewhat not sure, if the custom events should have an internal event for it
        //? or we going the route of eventHandler
        //? i think event handler is making more visual sense, since it's easir in terms of async/await :/.
        //? huh not sure, let's see
        //if we don't have a registered listener for this event

        //?ok so we ignore error if it has rid, so it can be handeled by the emitAwait handler
        //?if the error has event property user can get it as useError("event", () => {})
        //?if the error doesnot has event, user can get it as useError("error", () => {})
        //?lastly users can also get the useError("all") for all three

        //? should be provide it as onError on room ?
        //? .onError("error", () => {})
        if (parsedData.error && !parsedData.rid) {
          this.eventHub.error.notify(parsedData);

          console.log(`here`);
          return;
        } else if (parsedData.error && parsedData.event && parsedData.rid) {
          // ? ok so how do we identify, normal .on from .on of emit await?
          //todo diff between, normal .on vas .on for emitAwait. so we don't notify other .on for same event in case of errors
          //todo right now users well have to add a guard, which is not ideal :(  ;
          //? huh dunno really, what are the chances :/ minimal

          //-_- it's doing the same thing as below
          for (let cb of this.events[
            parsedData.event as keyof InternalListenersMap
          ]) {
            cb.exec(parsedData);
          }

          return;
        }

        if (!this.events[parsedData.event as keyof InternalListenersMap]) {
          return;
        }

        for (let cb of this.events[
          parsedData.event as keyof InternalListenersMap
        ]) {
          cb.exec(parsedData);
        }
      } catch (error) {
        //notify when data is not parsable
        this.eventHub.message.notify(e);
      }
    });
  }

  updatePresence(data: Partial<TPresence>, type?: "partial"): void;
  updatePresence(data: TPresence, type: "set"): void;
  updatePresence(
    data: TPresence | Partial<TPresence>,
    type: "partial" | "set" = "partial"
  ) {
    if (type === "partial") {
      this._self?.partialSet("presence", data);
    } else {
      this._self?.set({ presence: data as TPresence });
    }
    this.eventHub.self.notify({});
    this._partySocket.send(
      JSON.stringify({ event: InternalEvents.PRESENSE_UPDATE, data })
    );

    // this.emit("presenceUpdate", data);
  }

  broadcast = (data: TBroadcastEvent) => {
    this._partySocket.send(
      JSON.stringify({ event: InternalEvents.BROADCAST, data })
    );
  };

  emit<K extends keyof TEventsEmit>(event: K, data: TEventsEmit[K]): void {
    const dataToSend = JSON.stringify({
      event,
      data,
    });
    this._partySocket.send(dataToSend);
  }

  //? ok so not sure what to do with this
  //? since we're gonna have throttles, buffers
  //? in case the state is disconnected, do we reject it outright
  //? do we wait the normal period in case the socket get's connected, but that will leave premature rejects
  //? do we start counting when the request is sent :/ it can take lot of time
  //? so sort of noop?
  //? so in a way it's the most experimental thing in this entire framework, it'll take some time to get this right
  //? maybe the simplest of all, just let the users implement this lol. we give the .on so should be doable
  //? ohh no wait we don't really expose or suggest using partysocket directly so, hmm. maybe?
  emitAwait<K extends keyof TEventsEmit = keyof TEventsEmit>(
    {
      event,
      data,
    }: {
      event: K;
      data: TEventsEmit[K];
    },
    options?: EmitAwaiOptions
  ): Promise<
    K extends keyof TEvents ? TEvents[Extract<K, keyof TEvents>] : unknown
  >;
  emitAwait<D, K extends keyof TEventsEmit = keyof TEventsEmit>(
    { event, data }: { event: K; data: TEventsEmit[K] },
    options?: EmitAwaiOptions
  ): Promise<D>;
  emitAwait<D, K extends keyof TEventsEmit>(
    { event, data }: { event: K; data: TEventsEmit[K] },
    options?: EmitAwaiOptions
  ): Promise<D> {
    return new Promise((resolve, reject) => {
      const requestId = uuid();

      const listenEvent = (options?.listenEvent || event) as keyof TEvents;
      //todo maybe it makes more sense to listen for allMessages, it'll allow to not depend on a particular event, but only on rid
      const functionId = this.on(listenEvent, (data) => {
        const responseId = data.rid;

        if (!responseId || responseId !== requestId) return;

        if (data.error) reject(data.error);

        clearTimeout(timeout);
        this.off(listenEvent, functionId);
        resolve(data.data);
      });

      const timeout = setTimeout(() => {
        this.off(listenEvent, functionId);
        reject(`no message recieved`);
      }, 5000);

      try {
        const stringifiedObjectResponse = JSON.stringify({
          data: {
            ...data,
          },
          event,
          rid: requestId,
        });

        console.log(stringifiedObjectResponse);

        this._partySocket.send(stringifiedObjectResponse);
        console.log(`[ Sent ${event as string} ]`);
      } catch (error) {
        clearTimeout(timeout);
        this.off(listenEvent, functionId);
        reject(error);
      }
    });
  }

  getOthers = (): Peer<TPresence, TUserMeta>[] => {
    return this._peers.current;
  };

  getPresence = (): TPresence | undefined => {
    return this._self?.current.presence;
  };

  //this should make up to be the individual es
  //a single subscribe is beeter than
  //todo add a single subscribe for javascript folks
  subscribe() {}

  leave() {
    this._partySocket.close();
  }

  getSelf = () => {
    return this._self?.current;
  };
}
