import type * as Party from "partykit/server";
import {
  PartyworksEvents,
  PartyworksParse,
  mergerPartial,
} from "partyworks-shared";
import { Bot, BotOptions, Player } from "./types";
import { MessageBuilder } from "./MessageBuilder";
import { MessageEvent } from "@cloudflare/workers-types";
import { PartyworksStringify } from "partyworks-shared";

export type CustomEvents<TEvents, TState> = {
  [K in keyof Partial<TEvents>]: {
    middlewares?: any; //? maybe event level middlewares makes sense
    validator?: (data: any) => void;
    handler: (
      server: PartyWorks,
      value: { rid?: string; data: TEvents[K]; event: string },
      player: Player<TState>
    ) => void;
  };
};

const noop = () => {};

export abstract class PartyWorks<
  TState = any,
  TPresence = any,
  TEventsListener extends Record<string, any> = {},
  TEventEmitters extends Record<string, any> = {},
  TBroadcasts extends Record<string, any> = any
> implements Party.Server
{
  #players: Player<TState, TEventEmitters, TPresence>[] = [];

  //todo api to listen for server broadcast
  #bots: Bot<TState, TPresence>[] = [];

  #_customEvents: CustomEvents<TEventsListener, TState> = {} as CustomEvents<
    TEventsListener,
    TState
  >;

  constructor(readonly party: Party.Party) {
    //setup custom events and other things, that you want to run in constrcutor
    this.setCustomEvent();
    this.setup();
  }

  //*-----------------------------------
  //*  Private Internal Methods, internal lib methods
  //*-----------------------------------

  #parseAndRouteMessage(e: MessageEvent, conn: Player) {
    try {
      //parse the message, note: reverting the placeholder with undefined in json.parse removes the key
      const parsedData = PartyworksParse(e.data as string);

      // this is how we track internal vs user messages [_pwf flag value to be set "-1" for internal events]
      // ok here internal events also mean custom events sent by user via the client's emit or emitAwait
      if (
        parsedData &&
        typeof parsedData.event === "number" &&
        parsedData._pwf === "-1"
      ) {
        this.#handleEvents(parsedData, conn);

        return;
      }

      console.log("unknown event");
      console.log(parsedData);
    } catch (error) {}
  }

  //checks the correct data format
  //well may not be neccessare since the user can check, still
  #_validatePresenceMessage(data: any) {
    if (!data || !data.type || (data.type !== "partial" && data.type !== "set"))
      return false;

    return true;
  }

  #handleEvents(parsedData: any, conn: Player) {
    try {
      switch (parsedData.event) {
        case PartyworksEvents.BATCH: {
          if (Array.isArray(parsedData.data)) {
            for (let event of parsedData.data) {
              this.#handleEvents(event, conn);
            }
          }
          break;
        }

        case PartyworksEvents.PRESENSE_UPDATE: {
          if (!this.#_validatePresenceMessage(parsedData.data)) return;
          if (!this.validatePresence(conn, parsedData.data)) return;

          this.#_updatePresence(
            conn,
            { presence: parsedData.data.data, type: parsedData.data.type },
            [conn.id]
          );

          break;
        }

        case PartyworksEvents.BROADCAST: {
          if (!this.validateBroadcast(conn, parsedData.data)) return;

          this.party.broadcast(
            PartyworksStringify(
              MessageBuilder.broadcastEvent(conn, parsedData.data)
            ),
            [conn.id]
          );

          this.#bots.forEach((bot) => bot.onBroadcast(conn, parsedData.data));
          break;
        }

        case PartyworksEvents.EVENT: {
          const { event, data } = parsedData.data;
          const eventHandler = this.#_customEvents[event];

          if (eventHandler) {
            try {
              const { validator, handler } = eventHandler;
              if (typeof validator === "function") {
                //? maybe we're expecting it to throw, or return false
                validator(data);
              }

              //? here also if throws we can handle maybe based on event & rid
              //?ok definitely makes sense to throw an error a default one & perhaps a custom one
              handler(
                this as any,
                {
                  data: data,
                  rid: parsedData.rid,
                  event: event,
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

          break;
        }

        default: {
          //ideally should never happen
          console.warn("Unknown messge with _pwf flag", parsedData);
        }
      }
    } catch (error) {}
  }

  #_updatePresence(
    conn: Player | Bot,
    presenceUpdate: { presence: any; type: any },
    ignore?: string[]
  ) {
    if (presenceUpdate.type === "set") {
      conn.presence = presenceUpdate.presence;
    } else if (presenceUpdate.presence) {
      conn.presence = mergerPartial(
        { ...conn.presence },
        { ...presenceUpdate.presence }
      );
    }

    //ok maybe here we can do some ack, but presence is fire & forget, dunno :/
    this.party.broadcast(
      PartyworksStringify(MessageBuilder.presenceUpdate(conn)),
      ignore
    );
  }

  //*-----------------------------------
  //* Userfacing Internal Methods, not to be overriden, sadly typescript does not have final keyword so we can't enforce em yet
  //*-----------------------------------

  getConnectedUsers(options?: { includeBots?: boolean }) {
    if (options && options.includeBots)
      return [...this.#players, ...this.#bots];

    return this.#players;
  }

  async handleConnect(
    connection: Player<TState, TEventEmitters>,
    ctx: Party.ConnectionContext
  ) {
    this.customDataOnConnect(connection, ctx);
    connection.addEventListener("message", (e) => {
      if (e.data === "PING") {
        connection.send("PONG");
        return;
      }
      this.#parseAndRouteMessage(e, connection);
    });

    this.#players.push(connection);

    const roomData = this.roomState();

    //send internal connect message & roomState
    // connection.send(JSON.stringify(MessageBuilder.connect(connection, data)));
    connection.send(
      PartyworksStringify(
        MessageBuilder.roomState({
          //@ts-ignore , we will sync the info property if defined
          info: connection.state?.info! as any,
          self: connection,
          users: [...this.#players, ...this.#bots],
          roomData,
        })
      )
    );

    //notify everyone that the user has connected
    this.party.broadcast(
      PartyworksStringify(MessageBuilder.userOnline(connection)),
      [connection.id]
    );

    //call the bot handlers
    this.#bots.forEach((bot) => bot.onUserJoined(connection));

    this.sendEventOnConnect(connection);
  }

  handleDisconnect(connection: Party.Connection) {
    this.#players = this.#players.filter((con) => con.id !== connection.id);

    this.party.broadcast(
      PartyworksStringify(MessageBuilder.userOffline(connection))
    );

    //call the bot handlers
    this.#bots.forEach((bot) => bot.onUserLeft(connection as any));
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
      const stringifiedData = PartyworksStringify(data, {
        excludeUndefined: true,
      });

      connection.send(stringifiedData);
    } catch (error) {
      console.log(`error sending data`);
    }
  }

  sendAwait<K extends keyof TEventEmitters>(
    connection: Party.Connection,
    data:
      | { rid: string; event: K; data: TEventEmitters[K] }
      | { rid: string; data?: any; [key: string]: any },
    options?: {
      sendToAllListeners?: boolean; //if true emitted to all listeners listening for that event, not limited to rid event listeners
    }
  ) {
    try {
      const stringifiedData = PartyworksStringify(
        { ...data, options },
        {
          excludeUndefined: true,
        }
      );

      connection.send(stringifiedData);
    } catch (error) {}
  }

  //this sends a client recognized error, event prop is optional
  //event will help in easy error association, or can be used as custom tags on error
  sendError<T extends keyof TEventsListener, K extends keyof TEventEmitters>(
    connection: Party.Connection,
    data: { error: any; event?: string | K | T; rid?: string },
    options?: {
      sendToAllListeners?: boolean; //if true emitted to all listeners listening for that event, not limited to rid event listeners
    }
  ): void {
    try {
      const stringifiedData = PartyworksStringify(
        { ...data, options },
        { excludeUndefined: true }
      );

      connection.send(stringifiedData);
    } catch (error) {
      console.log(`error sending error`); //lol
    }
  }

  //typesafe broadcast function for the room
  broadcast<K extends keyof TBroadcasts>(
    data: { event: K; data: TBroadcasts[K] },
    ignored?: string[]
  ): void {
    try {
      const stringifiedData = PartyworksStringify(data);

      this.party.broadcast(stringifiedData, ignored);
    } catch (error) {
      console.log(`error broadcasting data`);
    }
  }

  //ok here we take either a party.connection or a playerid
  //this function will give an api to update a user's presence
  updatePresence(
    conn: Party.Connection,
    data: { presence: Partial<TPresence>; type: "partial" }
  ): void;

  updatePresence(
    conn: Party.Connection,
    data: { presence: TPresence; type: "set" }
  ): void;
  updatePresence(
    conn: Party.Connection,
    {
      presence,
      type,
    }:
      | { presence: Partial<TPresence>; type: "partial" }
      | { presence: TPresence; type: "set" }
  ) {
    const player = conn as Player<any, any, TPresence>; //TYPECASTING :/
    this.#_updatePresence(player, { presence, type });
  }

  //ok how should we approach this
  //we will just broadast the meta update & the users need to make sure they do the setState before hand
  //since the way we do it rn depends on user setting the info property on serializeObject
  //well this is more llike broadcast userMeta at this point :/
  updateUserMeta(conn: Party.Connection) {
    this.party.broadcast(
      PartyworksStringify(MessageBuilder.metaUpdate(conn as Player))
    );
  }

  //* bot/server user api
  addBot<T = any>(
    id: string,
    { state, presence }: { state: T; presence: TPresence } & Partial<BotOptions>
  ): boolean;
  addBot(
    id: string,
    {
      state,
      presence,
    }: { state: TState; presence: TPresence } & Partial<BotOptions>
  ): boolean;
  addBot(
    id: string,
    {
      state,
      presence,
      onBroadcast,
      onPresenceUpdate,
      onUserJoined,
      onUserLeft,
    }: { state: TState; presence: TPresence } & Partial<BotOptions>
  ) {
    const existing = this.#bots.find((bot) => bot.id === id);

    if (existing) return false;

    const bot: Bot = {
      id,
      state,
      presence,
      onUserJoined: onUserJoined ?? noop,
      onUserLeft: onUserLeft ?? noop,
      onBroadcast: onBroadcast ?? noop,
      onPresenceUpdate: onPresenceUpdate ?? noop,
    };

    this.#bots.push(bot);

    //notify everyone that the user has connected
    this.party.broadcast(PartyworksStringify(MessageBuilder.userOnline(bot)));

    return true;
  }

  updateBotPresence(
    id: string,
    presence: Partial<TPresence>,
    type?: "partial"
  ): void;
  updateBotPresence(id: string, presence: TPresence, type: "set"): void;
  updateBotPresence(
    id: string,
    presence: Partial<TPresence> | TPresence,
    type: "set" | "partial" = "partial"
  ) {
    const bot = this.#bots.find((bot) => bot.id === id);

    //? hmm, should we return a boolean or maybe throw an error ?
    if (!bot) return;

    this.#_updatePresence(bot, { presence, type });
  }

  sendBotBroadcast(id: string, data: any, ignore?: string[]) {
    const bot = this.#bots.find((bot) => bot.id === id);

    //? hmm, should we return a boolean or maybe throw an error ?
    if (!bot) return;

    this.party.broadcast(
      PartyworksStringify(MessageBuilder.broadcastEvent(bot, data)),
      ignore
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
  customDataOnConnect(
    player: Player<TState, TEventEmitters>,
    ctx: Party.ConnectionContext
  ): void {}

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
    this.#_customEvents = data;
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
