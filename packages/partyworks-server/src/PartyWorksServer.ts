import type * as Party from "partykit/server";
import { InternalEvents, Player } from "./types";
import { MessageBuilder } from "./MessageBuilder";
import { MessageEvent } from "@cloudflare/workers-types";

type CustomEvents<TEvents, TState> = {
  [K in keyof Partial<TEvents>]: {
    middlewares?: any; //? maybe event level middlewares makes sense
    validator?: (data: any) => void;
    handler: (
      value: { rid?: string; data: TEvents[K]; event: string },
      player: Player<TState>
    ) => void;
  };
};

//ok so this pattern is a little bit more strict
//this can be annoying for some users dx wise as they just want typesafety in terms of messages
//this can inversely lead to bad dx and alot of duplicated code in cases that send same messages over different events
//but this is also the best in terms of type safety, lol even event safety
//aaaaghhh dunno, i want this one particularly for my funrooms version tough!
// export abstract class sq<
//   TState = any,
//   TEventsListener extends Record<string, any> = {},
//   TEventEmitters extends Record<
//     keyof TEventsListener,
//     { sends: any; broadcasts: any }
//   > = any,
//   TBroadcasts = any
// > {}

//todo maybe in future we can get more granular
//like having multiple options for send & broadcast on a per event level, that'll likely save many things

//todo remove one of the implementations for player.sendData vs this.send & partyworks.broadcastData vs this.broadcast
//well most likely player.sendData & partyworks.broadcastData are gonna be removed, since they funky :>

export abstract class PartyWorks<
  TState = any,
  TEventsListener extends Record<string, any> = {},
  TEventEmitters extends Record<string, any> = {},
  TBroadcasts extends Record<string, any> = any
> implements Party.Server
{
  readonly partyworks: Party.Party & {
    broadcastData: <K extends keyof TBroadcasts>(
      event: K,
      data: TBroadcasts[K]
    ) => void;
  };
  players: Player<TState, TEventEmitters>[] = [];

  //this is for sending custom
  customDataOnConnect(player: Player<TState, TEventEmitters>): void {}

  //maybe this is gonna be the custom state on connect
  customRoomState(player: Player<TState, TEventEmitters>): any {}

  //send the event that you want to send on connect here
  sendEventOnConnect(player: Player<TState, TEventEmitters>) {}

  roomState(): any | Promise<any> {}
  private _customEvents: CustomEvents<TEventsListener, TState> =
    {} as CustomEvents<TEventsListener, TState>;

  constructor(readonly party: Party.Party) {
    this.partyworks = party as any;

    this.partyworks.broadcastData = (event, data) => {
      try {
        const stringifiedData = JSON.stringify({ event, data });

        this.party.broadcast(stringifiedData);
      } catch (error) {
        console.log(`error broadcasting data`);
      }
    };
    this.setCustomEvent();
    this.setup();
  }

  //so this should have some basic properties, but can be easily ovverriden
  onConnect(
    connection: Party.Connection,
    ctx: Party.ConnectionContext
  ): void | Promise<void> {
    this.handleConnect(connection as Player, ctx);
  }

  onMessage(
    message: string | ArrayBuffer,
    sender: Party.Connection
  ): void | Promise<void> {}

  onClose(connection: Party.Connection): void | Promise<void> {
    this.handleClose(connection);
  }

  onError(connection: Party.Connection, error: Error): void | Promise<void> {
    this.handleError(connection);
  }

  async handleConnect(
    connection: Player<TState, TEventEmitters>,
    ctx: Party.ConnectionContext
  ) {
    this.customDataOnConnect(connection);
    connection.addEventListener("message", (e) => {
      this.handleEvents(e, connection);
    });

    this.players.push(connection);

    const roomData = this.roomState();

    connection.sendData = <K extends keyof TEventEmitters>(
      event: K,
      data: TEventEmitters[K]
    ) => {
      try {
        const stringifiedData = JSON.stringify({ event, data });

        connection.send(stringifiedData);
      } catch (error) {
        console.log(`error sending data`);
      }
    };

    //send internal connect message & roomState
    // connection.send(JSON.stringify(MessageBuilder.connect(connection, data)));
    connection.send(
      JSON.stringify(
        MessageBuilder.roomState({
          //@ts-ignore , we will sync the info property if defined
          info: connection.state?.info! as any,
          self: connection,
          users: this.players,
          roomData,
        })
      )
    );

    //notify everyone that the user has connected
    this.party.broadcast(
      JSON.stringify(MessageBuilder.userOnline(connection)),
      [connection.id]
    );

    this.sendEventOnConnect(connection);
  }

  handleDisconnect(connection: Party.Connection) {
    this.players = this.players.filter((con) => con.id !== connection.id);

    this.party.broadcast(
      JSON.stringify(MessageBuilder.userOffline(connection))
    );
  }

  handleClose(connection: Party.Connection) {
    this.handleDisconnect(connection);
  }
  handleError(connection: Party.Connection) {
    this.handleDisconnect(connection);
  }

  handleEvents(e: MessageEvent, conn: Player) {
    try {
      const parsedData = JSON.parse(e.data as string);

      //todo, this is how we track internal vs user messages [_pwf flag value to be set "-1" for internal events]
      //todo ok here internal events also mean custom events sent by user via the client's emit or emitAwait
      if (parsedData.event && parsedData._pwf === "-1") {
      }
      switch (parsedData.event) {
        case InternalEvents.PRESENSE_UPDATE: {
          //todo implement proper merging, at sub field levels as well
          conn.presence = { ...conn.presence, ...parsedData.data };

          console.log(`sending an update or no?`);
          //ok maybe here we can do some ack, but presence is fire & forget, dunno :/
          this.party.broadcast(
            JSON.stringify(MessageBuilder.presenceUpdate(conn)),
            [conn.id]
          );
          break;
        }

        case InternalEvents.BROADCAST: {
          console.log(`broadcastig`);
          this.party.broadcast(
            JSON.stringify(
              MessageBuilder.broadcastEvent(conn, parsedData.data)
            ),
            [conn.id]
          );
          break;
        }

        default: {
          //now check for internal custom events

          const eventHandler = this._customEvents[parsedData.event];

          if (eventHandler) {
            try {
              const { validator, handler } = eventHandler;
              if (typeof validator === "function") {
                //? maybe we're expecting it to throw, or return false
                validator(parsedData.data);
              }

              //? here also if throws we can handle maybe based on event & rid
              //?ok definitely makes sense to throw an error a default one & perhaps a custom one
              handler(
                {
                  data: parsedData.data,
                  rid: parsedData.rid,
                  event: parsedData.event,
                },
                conn
              );

              return;
            } catch (error) {
              //this should be safe, and should not throw any error, otherwise bad bad bad!
              this.catchAll(error, parsedData, conn);

              return;
            }
          }

          this.notFound(parsedData, conn);
          console.log("unknown event");
          console.log(parsedData);
        }
      }
    } catch (error) {}
  }

  setup() {}
  setCustomEvent() {}

  //todo by default this is gonna be called
  //todo this can/should be easily overridden by the user
  catchAll(
    error: any,
    {}: { data: any; rid: any; event: any }, //todo this can be any, in case of unknown events maybe we throw 404 instead :/
    player: Party.Connection
  ) {}

  //this handle notfound events, this should be overridden by the user, default is noop
  notFound(parsedData: any, player: Party.Connection) {}

  globalMiddlewares() {}

  //ok how should error event look like
  //event: "error", for: "eventName" , reason: User's imlplementation, could be an object or string, or undefined
  //this makes error handling difficult for emitAwait events
  //but this makes error handling simple for globalized events, just a simple useError("eventName")
  //maybe then we can for emitAwait events just listen for both  error & event props?
  //wait if useError is gonna be the prop and for eventName, we can easily listen for events with error property that makes sense!
  sendErrorEvent() {}

  customEvents(data: CustomEvents<TEventsListener, TState>) {
    this._customEvents = data;
  }

  send<K extends keyof TEventEmitters>(
    connection: Party.Connection,
    data: { event: K; data: TEventEmitters[K] }
  ) {
    try {
      const stringifiedData = JSON.stringify(data);

      connection.send(stringifiedData);
    } catch (error) {
      console.log(`error sending data`);
    }
  }

  //this sends a client recognized error, event prop is optional
  //event will help in easy error association, or can be used as custom tags on error
  sendError<T extends keyof TEventsListener, K extends keyof TEventEmitters>(
    connection: Party.Connection,
    data: { error: any; event?: string | K | T; rid?: string }
  ) {
    try {
      const stringifiedData = JSON.stringify(data);

      connection.send(stringifiedData);
    } catch (error) {
      console.log(`error sending error`); //lol
    }
  }

  broadcast<K extends keyof TBroadcasts>(
    data: { event: K; data: TBroadcasts[K] },
    ignored?: string[]
  ): void {
    try {
      const stringifiedData = JSON.stringify(data);

      this.party.broadcast(stringifiedData, ignored);
    } catch (error) {
      console.log(`error broadcasting data`);
    }
  }
}
