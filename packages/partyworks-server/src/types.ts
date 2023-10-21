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
