import type * as Party from "partykit/server";

export interface Player<
  TState = any,
  TEvents extends Record<string, any> = {},
  TPresence = any
> extends Party.Connection<TState> {
  presence: TPresence;
  emit: <K extends keyof TEvents>(event: K, data: TEvents[K]) => void;
  sendData: <K extends keyof TEvents>(event: K, data: TEvents[K]) => void;
}

export interface BotOptions {
  onBroadcast(player: Player, data: any): void | Promise<void>;
  onPresenceUpdate(): void | Promise<void>;
  onUserLeft(player: Player): void | Promise<void>;
  onUserJoined(player: Player): void | Promise<void>;
}

export interface Bot<TState = any, TPresence = any> extends BotOptions {
  id: string;
  presence: TPresence;
  state: TState;
}
