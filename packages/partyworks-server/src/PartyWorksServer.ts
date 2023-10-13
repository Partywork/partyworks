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
  TBroadcasts extends Record<string, any> = any,
  TPresence = any
> implements Party.Server
{
  readonly partyworks: Party.Party & {
    broadcastData: <K extends keyof TBroadcasts>(
      event: K,
      data: TBroadcasts[K]
    ) => void;
  };
  //todo :/ not really needed, well maybe for type safety, huh, dunno, since partykit has added getState | setState to the connection
  players: Player<TState, TEventEmitters, TPresence>[] = [];

  private _customEvents: CustomEvents<TEventsListener, TState> =
    {} as CustomEvents<TEventsListener, TState>;

  constructor(readonly party: Party.Party) {
    this.partyworks = party as any;

    //todo remove this, i personally don't like this api, kinda hacky, this.broadcast works fine
    this.partyworks.broadcastData = (event, data) => {
      try {
        const stringifiedData = JSON.stringify({ event, data });

        this.party.broadcast(stringifiedData);
      } catch (error) {
        console.log(`error broadcasting data`);
      }
    };

    //setup custom events and other things, that you want to run in constrcutor
    this.setCustomEvent();
    this.setup();
  }

  //*-----------------------------------
  //* Private Internal Methods, internal lib methods
  //*-----------------------------------

  //checks the correct data format
  //well may not be neccessare since the user can check, still
  private _validatePresenceMessage(data: any) {
    if (!data || !data.type || (data.type !== "partial" && data.type !== "set"))
      return false;

    return true;
  }

  private handleEvents(e: MessageEvent, conn: Player) {
    try {
      const parsedData = JSON.parse(e.data as string);

      //todo, this is how we track internal vs user messages [_pwf flag value to be set "-1" for internal events]
      //todo ok here internal events also mean custom events sent by user via the client's emit or emitAwait
      if (parsedData.event && parsedData._pwf === "-1") {
        switch (parsedData.event) {
          case InternalEvents.PRESENSE_UPDATE: {
            if (!this._validatePresenceMessage(parsedData.data)) return;
            if (!this.validatePresence(conn, parsedData.data)) return;

            if (parsedData.data.type === "set") {
              conn.presence = parsedData.data.data;
            } else if (parsedData.data.data) {
              //todo listen for type 'set' | 'partial' fields as well
              //todo implement proper merging, at sub field levels as well
              conn.presence = { ...conn.presence, ...parsedData.data.data };
            }

            console.log(`sending an update or no?`);
            //ok maybe here we can do some ack, but presence is fire & forget, dunno :/
            this.party.broadcast(
              JSON.stringify(MessageBuilder.presenceUpdate(conn)),
              [conn.id]
            );
            break;
          }

          case InternalEvents.BROADCAST: {
            if (!this.validateBroadcast(conn, parsedData.data)) return;

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
      }
    } catch (error) {}
  }

  //*-----------------------------------
  //* Userfacing Internal Methods, not to be overriden, sadly typescript does not have final keyword so we can't enforce em yet
  //*-----------------------------------

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

    //todo remove this, this api gives sendData to player/cconnection itself, i feel this.send is a much better and cleaner api
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

  //typesafe send function
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
  protected sendError<
    T extends keyof TEventsListener,
    K extends keyof TEventEmitters
  >(
    connection: Party.Connection,
    data: { error: any; event?: string | K | T; rid?: string }
  ): void {
    try {
      const stringifiedData = JSON.stringify(data);

      connection.send(stringifiedData);
    } catch (error) {
      console.log(`error sending error`); //lol
    }
  }

  //typesafe broadcast function for the room
  protected /*final*/ broadcast<K extends keyof TBroadcasts>(
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

  //todo
  // adding a updatePresence & udpateUserMeta function, to let users update it on thier own as well
  // also adding optional validators for Presence, so the users can easily validate it on the server if they want

  //ok here we take either a party.connection or a playerid
  //this function will give an api to update a user's presence
  updatePresence(conn: Party.Connection, presence: Partial<TPresence>) {
    const player = conn as Player<any, any, TPresence>; //TYPECASTING :/

    player.presence = { ...player.presence, ...presence };

    this.party.broadcast(JSON.stringify(MessageBuilder.presenceUpdate(player)));
  }

  //ok how should we approach this
  //we will just broadast the meta update & the users need to make sure they do the setState before hand
  //since the way we do it rn depends on user setting the info property on serializeObject
  //well this is more llike broadcast userMeta at this point :/
  updateUserMeta(conn: Party.Connection) {
    this.party.broadcast(
      JSON.stringify(MessageBuilder.metaUpdate(conn as Player))
    );
  }

  //*-----------------------------------
  //* Potential Overriders, these have default functionality but can also be overriden
  //*-----------------------------------

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

  //*-----------------------------------
  //* Overriders, default functionality is noop these are supposed to be overriden by the users
  //*-----------------------------------

  //? this is for getting roomState maybe,
  roomState(): any | Promise<any> {}

  //this is for sending custom
  customDataOnConnect(player: Player<TState, TEventEmitters>): void {}

  //maybe this is gonna be the custom state on connect
  customRoomState(player: Player<TState, TEventEmitters>): any {}

  //send the event that you want to send on connect here
  sendEventOnConnect(player: Player<TState, TEventEmitters>) {}

  //let's you check for and validate the presenceUpdates for a user
  //you should never throw an error in this one, return a booolean to indicate if this should fail or not fail
  validatePresence(
    player: Player<TState, TEventEmitters, TPresence>,
    data: any //ideally should be {type: "partial" | "set",  data: TPresence | Partial<TPresence>}
  ): boolean {
    return true;
  }

  //let's you checks and validate the broadcast messages
  //you should never throw an error in this one, return a booolean to indicate if this should fail or not fail
  validateBroadcast(
    player: Player<TState, TEventEmitters, TPresence>,
    data: any
  ): boolean {
    return true;
  }

  //these are run in the constructor, for those who don't wanna do the constructor super thing in child class
  setup() {}
  setCustomEvent() {}

  //sets the custom events
  customEvents(data: CustomEvents<TEventsListener, TState>) {
    this._customEvents = data;
  }

  //this will send all your custom events related errors, for both handlers & validators
  catchAll(
    error: any,
    {}: { data: any; rid: any; event: any }, //todo this can be any, in case of unknown events maybe we throw 404 instead :/
    player: Party.Connection
  ) {}

  //this handle notfound events, this should be overridden by the user, default is noop
  notFound(parsedData: any, player: Party.Connection) {}

  //todo maybe adding a global middleware kinda setup for custom events
  globalMiddlewares() {}
}
