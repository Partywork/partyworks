import type {
  PartySocketConnectionState,
  PartySocketOptions,
  PartySocketStatus,
} from "partyworks-socket";
import { PartySocket } from "partyworks-socket";
import {
  SingleEventSource,
  type UnsubscribeListener,
  PartyworksEvents,
} from "partyworks-shared";

import { ImmutableObject } from "../immutables/ImmutableObject";
import type { Peer, Self } from "../types";
import { ImmutablePeers } from "../immutables/ImmutableOthers";

import { PartyWorksEventSource } from "./EventSource";
import { v4 as uuid } from "uuid";
import { MessageBuilder } from "./MessageBuilder";

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

type OthersEvent<TPresence, TUserMeta> =
  | { type: "set" } //this event is when the ROOM_STATE is recieved and peers are populated
  | { type: "enter"; other: Peer<TPresence, TUserMeta> }
  | { type: "leave"; other: Peer<TPresence, TUserMeta> }
  | {
      type: "presenceUpdate";
      updates: Partial<TPresence>;
      other: Peer<TPresence, TUserMeta>;
    }
  | {
      type: "metaUpdate";
      updates: Partial<TUserMeta>;
      other: Peer<TPresence, TUserMeta>;
    };

type Subscribe<T> = (data: T) => void;

type RoomEventSubscriberMap<TPresence, TUserMeta, TBroadcastEvent> = {
  allMessages: Subscribe<MessageEvent<any>>;
  message: Subscribe<MessageEvent<any>>;
  others: Subscribe<{
    others: Peer<TPresence, TUserMeta>[];
    event: OthersEvent<TPresence, TUserMeta>;
  }>;
  self: Subscribe<Self<TPresence, TUserMeta>>; //todo maybe make this an update type like other 'presenceUpdated' | 'metaUpdated'
  myPresence: Subscribe<TPresence>;
  event: Subscribe<
    RoomBroadcastEventListener<TPresence, TUserMeta, TBroadcastEvent>
  >;
  //todo improve on typescript, atleast the ability to add a generic and override the values should be there
  error: Subscribe<{ error: any; event?: string }>;

  status: Subscribe<PartySocketStatus>;
};

//i think for the internal events we can have rpc based format, but custom events can be tricky the ones that don't follow req/res format
type PartyworksEventsMap =
  | {
      event: PartyworksEvents.CONNECT;
      data: { id: string };
    }
  | {
      event: PartyworksEvents.ROOM_STATE;
      data: {
        self: {
          info: any; //this is TUserMeta
          data: { id: string };
        };
        users: Peer[];
      };
    }
  | {
      event: PartyworksEvents.USER_JOINED;
      data: { userId: string; info: any; presence: any };
    }
  | { event: PartyworksEvents.USER_LEFT; data: { userId: string } }
  | {
      event: PartyworksEvents.PRESENSE_UPDATE;
      data: { userId: string; data: any };
    }
  | {
      event: PartyworksEvents.USERMETA_UPDATE;
      data: { userId: string; data: any };
    }
  | {
      event: PartyworksEvents.BROADCAST;
      data: { data: any; userId: string };
    };

type UpdateMyPresence<TPresence> = {
  (data: Partial<TPresence>, type?: "partial"): void;
  (data: TPresence, type: "set"): void;
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
  private _id: string;
  private _partySocket: PartySocket;
  private _loaded: boolean = false; //we count that we're still connecting if this is not laoded yet
  private _self?: ImmutableObject<Self<TPresence, TUserMeta>>; //not sure how to structure this one?
  private _peers: ImmutablePeers<TPresence, TUserMeta>;
  private _lostConnectionTimeout?: ReturnType<typeof setTimeout>; //timeout for when a connection is lost

  eventHub: {
    allMessages: SingleEventSource<MessageEvent<any>>; //for all the messages, servers as socket.addEventlistener("message")
    message: SingleEventSource<MessageEvent<any>>; //for all but internal messages, internal ones will be ignored, most likely user's use this one
    others: SingleEventSource<{
      others: Peer<TPresence, TUserMeta>[];
      event: OthersEvent<TPresence, TUserMeta>;
    }>; //others/peers in the room
    self: SingleEventSource<Self<TPresence, TUserMeta>>; //self
    myPresence: SingleEventSource<TPresence>; //a local my presence
    event: SingleEventSource<
      RoomBroadcastEventListener<TPresence, TUserMeta, TBroadcastEvent>
    >; //this is for broadcast api
    error: SingleEventSource<{ error: any; event?: string }>; //this is for event & non event based errors
    status: SingleEventSource<PartySocketConnectionState>;
  };
  //? wait can't i make it a single event source
  private ridListeners = new SingleEventSource<
    Readonly<TEvents[keyof TEvents]>
  >(); //another EventSource just for ridListeners

  constructor(
    options: PartySocketOptions & Partial<{ lostConnectionTimeout: number }>
  ) {
    super();

    this._id = options.room;

    //we will start closed
    this._partySocket = new PartySocket({
      ...options,
    });

    this._partySocket.eventHub.status.subscribe(this.handleLostConnection);

    this.eventHub = {
      allMessages: new SingleEventSource(),
      message: new SingleEventSource(),
      others: new SingleEventSource(),
      self: new SingleEventSource(),
      myPresence: new SingleEventSource(),
      event: new SingleEventSource(),
      error: new SingleEventSource(),
      status: this._partySocket.eventHub.status,
    };
    this._message();
    this._peers = new ImmutablePeers();
  }

  get id() {
    return this._id;
  }

  connect() {
    if (!this._partySocket.started) {
      this._partySocket.start();
    } else {
      this._partySocket.reconnect();
    }
    //TODO implement a proper connection state, and use it for tracking states &  bufffering
    this._partySocket.eventHub.status.subscribe((status) => {
      console.log(`socket status ${this._partySocket.getStatus()} [${status}]`);
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
    this._partySocket.eventHub.messages.subscribe((e) => {
      //this handler is always called, as it is a basic all message event handler
      // this.emit(InternalListeners.Message, e);

      this.eventHub.allMessages.notify(e);

      try {
        const parsedData = JSON.parse(e.data);

        if (
          !parsedData ||
          (typeof parsedData.event === "undefined" &&
            typeof parsedData.error === "undefined" &&
            typeof parsedData.rid === "undefined")
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
          Object.values(PartyworksEvents).includes(
            parsedData.event as PartyworksEvents
          ) &&
          //internal flag checker, used to track internal messages
          parsedData._pwf === "-1"
        ) {
          const data = parsedData as PartyworksEventsMap;

          switch (data.event) {
            //ok so initially i was going with two events connenct & room_state. (this is the same setup for funrooms)
            //but for ease and simplicity that'll be the same message now
            case PartyworksEvents.ROOM_STATE: {
              this._loaded = true;
              this._self = new ImmutableObject<Self>({
                data: {
                  id: this._partySocket.id,
                  // _pkUrl: this._partySocket._pkurl,
                },
                info: data.data.self.info, //this is provided by the user on backend
                presence: undefined,
              });

              const usersWithoutSelf = data.data.users.filter(
                (user) => user.userId !== this._self?.current.data.id
              );
              this._peers.addPeers(usersWithoutSelf);
              this.eventHub.others.notify({
                others: this._peers.current,
                event: { type: "set" },
              });
              this.eventHub.self.notify(this._self.current);
              // this.emit("roomUpdate", { data: { others: this._peers.current } });
              break;
            }

            case PartyworksEvents.USER_JOINED: {
              const peer = this._peers.addPeer(data.data as any);

              this.eventHub.others.notify({
                others: this._peers.current,
                event: { type: "enter", other: peer },
              });
              // this.emit("userJoined", { peer: data.data });
              break;
            }

            case PartyworksEvents.USER_LEFT: {
              const peer = this._peers.disconnectPeer(data.data.userId);

              if (peer) {
                this.eventHub.others.notify({
                  others: this._peers.current,
                  event: { type: "leave", other: peer },
                });
              }

              // this.emit("userleft", { peer: data.data });
              break;
            }

            case PartyworksEvents.PRESENSE_UPDATE: {
              if (data.data.userId === this._self?.current.data.id) {
                this._self.partialSet("presence", data.data.data);
                this.eventHub.self.notify(this._self.current);
                this.eventHub.myPresence.notify(this._self?.current.presence!);

                return;
              }

              const peer = this._peers.updatePeer(data.data.userId, {
                presence: data.data.data,
              });
              if (peer)
                this.eventHub.others.notify({
                  others: this._peers.current,
                  event: {
                    type: "presenceUpdate",
                    updates: data.data.data,
                    other: peer,
                  },
                });
              // this.emit("peersUpdate", {});
              break;
            }

            case PartyworksEvents.USERMETA_UPDATE: {
              if (data.data.userId === this._self?.current.data.id) {
                this._self.partialSet("info", data.data.data);
                this.eventHub.self.notify(this._self.current);
                return;
              }

              const peer = this._peers.updatePeer(data.data.userId, {
                info: data.data.data,
              });
              if (peer)
                this.eventHub.others.notify({
                  others: this._peers.current,
                  event: {
                    type: "metaUpdate",
                    updates: data.data.data,
                    other: peer,
                  },
                });

              break;
            }

            case PartyworksEvents.BROADCAST: {
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

        //ok new logic let's diff events & errors
        if (parsedData.error) {
          if (parsedData.rid) {
            if (parsedData.options?.sendToAllListeners) {
              //here broadcast to everyone and also broadcast to rid listeners

              this.ridListeners.notify(parsedData);
              this.eventHub.error.notify(parsedData);
            } else {
              //only broadcast to rid listeners

              this.ridListeners.notify(parsedData);
            }
          } else {
            //no rid broadcast to everyone except ridListeners, a normal es event
            this.eventHub.error.notify(parsedData);
          }

          return;
        }

        //now we're here that means this is not an error for sure
        if (parsedData.rid) {
          if (parsedData.options?.sendToAllListeners) {
            //here do the exec to everyone.
            //including the rid listerners
            this.ridListeners.notify(parsedData);

            if (!this.events[parsedData.event]) {
              return;
            }

            for (let cb of this.events[parsedData.event]) {
              cb.exec(parsedData.data);
            }
          } else {
            //only broadcast to the rid listeners
            this.ridListeners.notify(parsedData);
          }
        } else {
          //this is a normal message just do a normal exec
          if (!this.events[parsedData.event]) {
            return;
          }

          for (let cb of this.events[parsedData.event]) {
            cb.exec(parsedData.data);
          }
        }
      } catch (error) {
        //notify when data is not parsable
        this.eventHub.message.notify(e);
      }
    });
  }

  updatePresence: UpdateMyPresence<TPresence> = (
    data: TPresence | Partial<TPresence>,
    type: "partial" | "set" = "partial"
  ): void => {
    //todo make sure the self is always there? for presence updates locally.
    //it can be left in a non ack state, where we don't consider it acked yet
    //ok anyways revise this

    if (this._self) {
      if (type === "partial") {
        this._self?.partialSet("presence", data);
      } else {
        this._self?.set({ presence: data as TPresence });
      }
      this.eventHub.myPresence.notify(this._self?.current.presence!);
      this.eventHub.self.notify(this._self.current!);
      this._partySocket.send(
        JSON.stringify(
          MessageBuilder.updatePresenceMessage({ data, type }),
          (k, v) => (v === undefined ? null : v) //we replace undefined with null, since stringify removes undefined props
        )
      );
    }

    // this.emit("presenceUpdate", data);
  };

  broadcast = (data: TBroadcastEvent) => {
    this._partySocket.send(
      JSON.stringify(MessageBuilder.broadcastMessage(data))
    );
  };

  emit<K extends keyof TEventsEmit>(event: K, data: TEventsEmit[K]): void {
    const dataToSend = JSON.stringify(MessageBuilder.emitMessage(event, data));
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

      //todo we can use this to make sure event prop exist on response, else ignore
      const listenEvent = (options?.listenEvent || event) as keyof TEvents;

      const unsub = this.ridListeners.subscribe((data) => {
        const responseId = data.rid;

        if (!responseId || responseId !== requestId) return;

        if (data.error) reject(data.error);

        clearTimeout(timeout);
        unsub();
        resolve(data.data);
      });

      const timeout = setTimeout(() => {
        unsub();
        reject(`no message recieved`);
      }, 5000);

      try {
        const stringifiedObjectResponse = JSON.stringify(
          MessageBuilder.emitAwaitMessage({ event, data, rid: requestId })
        );

        this._partySocket.send(stringifiedObjectResponse);
        console.log(`[ Sent ${event as string} ]`);
      } catch (error) {
        clearTimeout(timeout);
        unsub();
        reject(error);
      }
    });
  }

  //todo
  handleLostConnection = () => {
    //we don't care for initial &
    const status = this._partySocket.getStatus();
  };

  getOthers = (): Peer<TPresence, TUserMeta>[] => {
    return this._peers.current;
  };

  getPresence = (): TPresence | undefined => {
    return this._self?.current.presence;
  };

  getStatus = () => {
    return this._partySocket.getStatus();
  };

  //this should make up to be the individual es
  //a single subscribe is beeter than
  //todo add a single subscribe for javascript folks
  subscribe<
    K extends keyof RoomEventSubscriberMap<
      TPresence,
      TUserMeta,
      TBroadcastEvent
    >
  >(
    event: K,
    callback: RoomEventSubscriberMap<TPresence, TUserMeta, TBroadcastEvent>[K]
  ): UnsubscribeListener;
  subscribe<T>(
    event: keyof RoomEventSubscriberMap<TPresence, TUserMeta, TBroadcastEvent>,
    callback: Subscribe<T>
  ): UnsubscribeListener;

  subscribe<T>(
    event: keyof RoomEventSubscriberMap<TPresence, TUserMeta, TBroadcastEvent>,
    callback: Subscribe<T>
  ): UnsubscribeListener {
    switch (event) {
      case "allMessages": {
        return this.eventHub.allMessages.subscribe(callback as any);
      }
      case "message": {
        return this.eventHub.message.subscribe(callback as any);
      }
      case "error": {
        return this.eventHub.error.subscribe(callback as any);
      }
      case "event": {
        return this.eventHub.event.subscribe(callback as any);
      }

      case "myPresence": {
        return this.eventHub.myPresence.subscribe(callback as any);
      }

      case "others": {
        return this.eventHub.others.subscribe(callback as any);
      }

      case "self": {
        return this.eventHub.self.subscribe(callback as any);
      }

      case "status":
        return this.eventHub.status.subscribe(callback as any);

      default: {
        //? should we throw
        // console.warn(`Unknown event on room.subsribe ${event}`);
        throw new Error(`Unknown event on room.subsribe ${event}`);
      }
    }
  }

  leave() {
    this._partySocket.close();
  }

  getSelf = () => {
    return this._self?.current;
  };
}
