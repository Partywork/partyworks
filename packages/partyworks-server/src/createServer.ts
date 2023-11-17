import Party from "partykit/server";
import { CustomEvents, PartyWorks } from "./PartyWorksServer";
import { Player } from "./types";

interface CreateServerOptions<
  TState,
  TPresence,
  TEventEmitters extends Record<string, any>,
  TEventsListener extends Record<string, any>,
  TBroadcasts extends Record<string, any>,
  TPartyWorks = PartyWorks<
    TState,
    TPresence,
    TEventsListener,
    TEventEmitters,
    TBroadcasts
  >
> {
  customEvents: CustomEvents<TEventsListener, TState>;

  onStart(self: TPartyWorks): Promise<void>;

  onBeforeConnect(
    request: Party.Request,
    lobby: Party.Lobby
  ): void | Promise<void>;

  onBeforeRequest(request: Party.Request): void | Promise<void>;

  setup(self: TPartyWorks): void;
  catchAll(
    self: TPartyWorks,
    error: any,
    {}: { data: any; rid: any; event: any },
    player: Party.Connection
  ): void;
  notFound(self: TPartyWorks, parsedData: any, player: Party.Connection): void;
  onConnect(
    self: TPartyWorks,
    connection: Party.Connection,
    ctx: Party.ConnectionContext
  ): void | Promise<void>;
  onMessage(
    self: TPartyWorks,
    message: string | ArrayBuffer,
    sender: Party.Connection
  ): void | Promise<void>;
  onClose(
    self: TPartyWorks,
    connection: Party.Connection
  ): void | Promise<void>;
  onError(
    self: TPartyWorks,
    connection: Party.Connection,
    error: Error
  ): void | Promise<void>;
  roomState(self: TPartyWorks): any | Promise<any>;
  customDataOnConnect(
    self: TPartyWorks,
    player: Player<TState, TEventEmitters>,
    ctx: Party.ConnectionContext
  ): void;
  customRoomState(
    self: TPartyWorks,
    player: Player<TState, TEventEmitters>
  ): any;
  sendEventOnConnect(
    self: TPartyWorks,
    player: Player<TState, TEventEmitters>
  ): void;
  validatePresence(
    self: TPartyWorks,
    player: Player<TState, TEventEmitters, TPresence>,
    data: any //ideally should be {type: "partial" | "set",  data: TPresence | Partial<TPresence>}
  ): boolean;
  validateBroadcast(
    self: TPartyWorks,
    player: Player<TState, TEventEmitters, TPresence>,
    data: any
  ): boolean;
}

export function createServer<
  TState = any,
  TPresence = any,
  TEventsListener extends Record<string, any> = {},
  TEventEmitters extends Record<string, any> = {},
  TBroadcasts extends Record<string, any> = any
>(
  options: Partial<
    CreateServerOptions<
      TState,
      TPresence,
      TEventEmitters,
      TEventsListener,
      TBroadcasts
    >
  >
) {
  return class PartyServer extends PartyWorks<
    TState,
    TPresence,
    TEventsListener,
    TEventEmitters,
    TBroadcasts
  > {
    onStart(): void | Promise<void> {
      options.onStart?.call(this, this);
    }

    static async onBeforeRequest(request: Party.Request) {
      options.onBeforeRequest?.call(this, request);
    }

    static async onBeforeConnect(request: Party.Request, lobby: Party.Lobby) {
      options.onBeforeConnect?.call(this, request, lobby);
    }
    setup(): void {
      options.setup?.call(this, this);
    }
    setCustomEvent(): void {
      if (options.customEvents) this.customEvents(options.customEvents);
    }

    onConnect(
      connection: Party.Connection<unknown>,
      ctx: Party.ConnectionContext
    ): void | Promise<void> {
      options.onConnect?.call(this, this, connection, ctx);
      this.handleConnect(connection as Player, ctx);
    }

    onMessage(
      message: string | ArrayBuffer,
      sender: Party.Connection
    ): void | Promise<void> {
      options.onMessage?.call(this, this, message, sender);
    }

    onClose(connection: Party.Connection): void | Promise<void> {
      options.onClose?.call(this, this, connection);
      this.handleClose(connection);
    }

    onError(
      connection: Party.Connection<unknown>,
      error: Error
    ): void | Promise<void> {
      options.onError?.call(this, this, connection, error);
      this.handleError(connection);
    }

    roomState() {
      options.roomState?.call(this, this);
    }

    customDataOnConnect(
      player: Player<TState, TEventEmitters, any>,
      ctx: Party.ConnectionContext
    ): void {
      options.customDataOnConnect?.call(this, this, player, ctx);
    }

    customRoomState(player: Player<TState, TEventEmitters, any>) {
      options.customRoomState?.call(this, this, player);
    }

    sendEventOnConnect(player: Player<TState, TEventEmitters, any>): void {
      options.sendEventOnConnect?.call(this, this, player);
    }

    validatePresence(
      player: Player<TState, TEventEmitters, TPresence>,
      data: any
    ): boolean {
      if (options.validatePresence) {
        return options.validatePresence.call(this, this, player, data);
      }
      return true;
    }

    validateBroadcast(
      player: Player<TState, TEventEmitters, TPresence>,
      data: any
    ): boolean {
      if (options.validateBroadcast) {
        return options.validateBroadcast.call(this, this, player, data);
      }
      return true;
    }

    catchAll(
      error: any,
      message: { data: any; rid: any; event: any },
      player: Party.Connection<unknown>
    ): void {
      options.catchAll?.call(this, this, error, message, player);
    }

    notFound(parsedData: any, player: Party.Connection<unknown>): void {
      options.notFound?.call(this, this, parsedData, player);
    }

    globalMiddlewares(): void {}
  };
}
